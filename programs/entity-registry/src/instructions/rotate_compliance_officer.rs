use crate::errors::NexusError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(entity_id: [u8; 32])]
pub struct RotateComplianceOfficer<'info> {
    pub current_officer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"entity", entity_id.as_ref()],
        bump = entity_record.bump
    )]
    pub entity_record: Account<'info, EntityRecord>,
}

pub fn handler(
    ctx: Context<RotateComplianceOfficer>,
    entity_id: [u8; 32],
    new_officer: Pubkey,
) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;

    require!(
        ctx.accounts.current_officer.key() == entity.compliance_officer,
        NexusError::Unauthorized
    );

    let old_officer = entity.compliance_officer;
    entity.compliance_officer = new_officer;

    emit!(ComplianceOfficerRotated {
        entity_id,
        old_officer,
        new_officer,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct ComplianceOfficerRotated {
    pub entity_id: [u8; 32],
    pub old_officer: Pubkey,
    pub new_officer: Pubkey,
    pub timestamp: i64,
}
