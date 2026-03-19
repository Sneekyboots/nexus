use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("J4CSWfakHC2Ta7k2BTszksmgQLZU3cJAKpVDNgCgwXwq");

#[program]
pub mod entity_registry {
    use super::*;

    pub fn register_entity(
        ctx: Context<RegisterEntity>,
        entity_id: [u8; 32],
        legal_name: String,
        jurisdiction: u8,
        mandate_limits: state::MandateLimits,
    ) -> Result<()> {
        instructions::register_entity::handler(
            ctx,
            entity_id,
            legal_name,
            jurisdiction,
            mandate_limits,
        )
    }

    pub fn verify_entity(
        ctx: Context<VerifyEntity>,
        entity_id: [u8; 32],
        expiry_timestamp: i64,
    ) -> Result<()> {
        instructions::verify_entity::handler(ctx, entity_id, expiry_timestamp)
    }

    pub fn suspend_entity(
        ctx: Context<SuspendEntity>,
        entity_id: [u8; 32],
        reason: String,
    ) -> Result<()> {
        instructions::suspend_entity::handler(ctx, entity_id, reason)
    }

    pub fn update_mandate_limits(
        ctx: Context<UpdateMandateLimits>,
        entity_id: [u8; 32],
        new_limits: state::MandateLimits,
    ) -> Result<()> {
        instructions::update_mandate_limits::handler(ctx, entity_id, new_limits)
    }

    pub fn rotate_compliance_officer(
        ctx: Context<RotateComplianceOfficer>,
        entity_id: [u8; 32],
        new_officer: Pubkey,
    ) -> Result<()> {
        instructions::rotate_compliance_officer::handler(ctx, entity_id, new_officer)
    }
}
