use crate::errors::PoolingError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub pool_admin: Signer<'info>,

    #[account(
        init,
        payer = pool_admin,
        space = 8 + 32 + 32 + 2 + 210 + 16 + 8 + 1 + 8 + 8 + 1,
        seeds = [b"pool", pool_id.as_ref()],
        bump
    )]
    pub pool_state: Account<'info, PoolState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreatePool>,
    pool_id: [u8; 32],
    sweep_threshold: u64,
    netting_frequency: u8,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool_state;
    let now = Clock::get()?.unix_timestamp;

    pool.pool_id = pool_id;
    pool.pool_admin = ctx.accounts.pool_admin.key();
    pool.member_count = 0;
    pool.supported_currencies = [CurrencyPair {
        code: [0; 3],
        mint: Default::default(),
    }; 6];
    pool.net_position_usd = 0;
    pool.last_netting_timestamp = now;
    pool.netting_frequency = match netting_frequency {
        0 => NettingFrequency::Hourly,
        1 => NettingFrequency::Daily,
        2 => NettingFrequency::Weekly,
        _ => NettingFrequency::Manual,
    };
    pool.sweep_threshold = sweep_threshold;
    pool.total_virtual_offsets = 0;
    pool.bump = ctx.bumps.pool_state;

    emit!(PoolCreated {
        pool_id,
        pool_admin: ctx.accounts.pool_admin.key(),
        sweep_threshold,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct PoolCreated {
    pub pool_id: [u8; 32],
    pub pool_admin: Pubkey,
    pub sweep_threshold: u64,
    pub timestamp: i64,
}
