use crate::errors::ComplianceError;
use anchor_lang::prelude::*;
use entity_registry::state::EntityRecord;

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: Source token account is validated by compliance engine
    pub source_token_account: UncheckedAccount<'info>,

    /// CHECK: Destination token account is validated by compliance engine
    pub destination_token_account: UncheckedAccount<'info>,

    /// The entity record for sender (from Layer 1)
    pub sender_entity: Account<'info, EntityRecord>,
}

pub fn handler(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let entity = &ctx.accounts.sender_entity;

    // STAGE 1: Check if entity is KYC verified and active
    require!(
        entity.is_active(now),
        ComplianceError::KycVerificationFailed
    );

    // STAGE 2: Check single transfer limit
    require!(
        !entity.exceeds_single_transfer_limit(amount),
        ComplianceError::SingleTransferExceedsLimit
    );

    // STAGE 3: Check daily aggregate limit
    require!(
        !entity.would_exceed_daily_limit(amount, now),
        ComplianceError::DailyAggregateExceedsLimit
    );

    // All checks passed - emit compliance certificate
    emit!(TransferApproved {
        entity_id: entity.entity_id,
        amount,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct TransferApproved {
    pub entity_id: [u8; 32],
    pub amount: u64,
    pub timestamp: i64,
}
