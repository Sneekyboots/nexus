use crate::errors::NexusError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(entity_id: [u8; 32])]
pub struct UpdateMandateLimits<'info> {
    pub compliance_officer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"entity", entity_id.as_ref()],
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(
    ctx: Context<UpdateMandateLimits>,
    entity_id: [u8; 32],
    new_limits: MandateLimits,
) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;

    require!(
        ctx.accounts.compliance_officer.key() == entity.compliance_officer,
        NexusError::Unauthorized
    );

    entity.mandate_limits = new_limits.clone();

    emit!(MandateLimitsUpdated {
        entity_id,
        max_single_transfer: new_limits.max_single_transfer,
        max_daily_aggregate: new_limits.max_daily_aggregate,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct MandateLimitsUpdated {
    pub entity_id: [u8; 32],
    pub max_single_transfer: u64,
    pub max_daily_aggregate: u64,
    pub timestamp: i64,
}
