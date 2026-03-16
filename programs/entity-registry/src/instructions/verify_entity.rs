use crate::errors::NexusError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(entity_id: [u8; 32])]
pub struct VerifyEntity<'info> {
    #[account(mut)]
    pub kyc_oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [b"entity", entity_id.as_ref()],
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(
    ctx: Context<VerifyEntity>,
    entity_id: [u8; 32],
    expiry_timestamp: i64,
) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    let now = Clock::get()?.unix_timestamp;

    require!(
        entity.kyc_status != KycStatus::Revoked,
        NexusError::Unauthorized
    );

    entity.kyc_status = KycStatus::Verified;
    entity.kyc_expiry = expiry_timestamp;
    entity.last_verified = now;

    emit!(EntityVerified {
        entity_id,
        expiry_timestamp,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct EntityVerified {
    pub entity_id: [u8; 32],
    pub expiry_timestamp: i64,
    pub timestamp: i64,
}
