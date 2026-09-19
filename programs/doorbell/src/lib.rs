use anchor_lang::prelude::*;

declare_id!("HZicSfxQJoL1NziAPYrvfpC9GKKjDssgiM6Tde5gH68H");

#[program]
pub mod doorbell {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
