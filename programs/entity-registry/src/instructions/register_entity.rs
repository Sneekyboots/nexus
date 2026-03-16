use crate::errors::NexusError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(entity_id: [u8; 32])]
pub struct RegisterEntity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 64 + 1 + 1 + 8 + 32 + 32 + 48 + 32 + 8 + 8 + 1,
        seeds = [b"entity", entity_id.as_ref()],
        bump
    )]
    pub entity_record: Account<'info, EntityRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterEntity>,
    entity_id: [u8; 32],
    legal_name: String,
    jurisdiction: u8,
    mandate_limits: MandateLimits,
) -> Result<()> {
    let entity = &mut ctx.accounts.entity_record;
    let now = Clock::get()?.unix_timestamp;

    entity.entity_id = entity_id;
    entity.legal_name = legal_name;
    entity.jurisdiction = match jurisdiction {
        0 => JurisdictionCode::FINMA,
        1 => JurisdictionCode::MICA,
        2 => JurisdictionCode::SFC,
        3 => JurisdictionCode::FCA,
        4 => JurisdictionCode::ADGM,
        5 => JurisdictionCode::RBI,
        _ => return Err(NexusError::InvalidJurisdiction.into()),
    };
    entity.kyc_status = KycStatus::Pending;
    entity.kyc_expiry = 0;
    entity.vault_address = Pubkey::default(); // Will be set during vault creation
    entity.pool_membership = Pubkey::default();
    entity.mandate_limits = mandate_limits;
    entity.compliance_officer = ctx.accounts.payer.key();
    entity.created_at = now;
    entity.last_verified = 0;
    entity.bump = ctx.bumps.entity_record;

    emit!(EntityRegistered {
        entity_id,
        legal_name: entity.legal_name.clone(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct EntityRegistered {
    pub entity_id: [u8; 32],
    pub legal_name: String,
    pub timestamp: i64,
}
