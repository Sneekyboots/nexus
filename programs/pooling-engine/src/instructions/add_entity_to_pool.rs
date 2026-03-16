use crate::errors::PoolingError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32], entity_id: Pubkey)]
pub struct AddEntityToPool<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool_id.as_ref()],
        bump = pool_state.bump
    )]
    pub pool_state: Account<'info, PoolState>,

    #[account(
        init,
        payer = pool_admin,
        space = 8 + 32 + 32 + 32 + 3 + 8 + 16 + 16 + 16 + 8 + 1,
        seeds = [b"entity_position", pool_id.as_ref(), entity_id.as_ref()],
        bump
    )]
    pub entity_position: Account<'info, EntityPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddEntityToPool>,
    pool_id: [u8; 32],
    entity_id: Pubkey,
    currency_mint: Pubkey,
    six_currency_code: [u8; 3],
) -> Result<()> {
    let pool = &mut ctx.accounts.pool_state;
    let position = &mut ctx.accounts.entity_position;
    let now = Clock::get()?.unix_timestamp;

    position.entity_id = entity_id;
    position.pool_id = Pubkey::new_from_array(pool_id);
    position.currency_mint = currency_mint;
    position.six_currency_code = six_currency_code;
    position.real_balance = 0;
    position.virtual_offset = 0;
    position.effective_position = 0;
    position.interest_accrued = 0;
    position.last_updated = now;
    position.bump = ctx.bumps.entity_position;

    pool.member_count += 1;

    emit!(EntityAddedToPool {
        pool_id,
        entity_id,
        currency_code: six_currency_code,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct EntityAddedToPool {
    pub pool_id: [u8; 32],
    pub entity_id: Pubkey,
    pub currency_code: [u8; 3],
    pub timestamp: i64,
}
