use crate::errors::NexusError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(entity_id: [u8; 32])]
pub struct SuspendEntity<'info> {
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"entity", entity_id.as_ref()],
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(ctx: Context<SuspendEntity>, entity_id: [u8; 32], reason: String) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    let now = Clock::get()?.unix_timestamp;

    // Only compliance officer or pool admin can suspend
    require!(
        ctx.accounts.signer.key() == entity.compliance_officer,
        NexusError::Unauthorized
    );

    entity.kyc_status = KycStatus::Suspended;

    emit!(EntitySuspended {
        entity_id,
        reason,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct EntitySuspended {
    pub entity_id: [u8; 32],
    pub reason: String,
    pub timestamp: i64,
}
