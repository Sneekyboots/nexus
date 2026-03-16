# NEXUS Protocol — PDA Seeds Documentation

All PDAs in the NEXUS protocol use the following seeds. Use these to derive addresses in client code.

## Layer 1: Entity Registry

### EntityRecord PDA
- **Seeds:** `[b"entity", entity_id: [u8; 32]]`
- **Program:** entity-registry
- **Description:** Stores KYC status, mandate limits, compliance officer, vault address
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"entity", &entity_id],
    &entity_registry_program_id
  )
  ```

---

## Layer 2: Notional Pooling Engine

### PoolState PDA
- **Seeds:** `[b"pool", pool_id: [u8; 32]]`
- **Program:** pooling-engine
- **Description:** Stores pool configuration, member count, net position, netting frequency
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"pool", &pool_id],
    &pooling_engine_program_id
  )
  ```

### EntityPosition PDA
- **Seeds:** `[b"entity_position", pool_id: [u8; 32], entity_id: [u8; 32]]`
- **Program:** pooling-engine
- **Description:** Stores real balance, virtual offset, effective position, interest accrued for each entity in a pool
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"entity_position", &pool_id, &entity_id],
    &pooling_engine_program_id
  )
  ```

### OffsetEvent PDA
- **Seeds:** `[b"offset_event", event_id: [u8; 32]]`
- **Program:** pooling-engine
- **Description:** Records a netting offset between two entities (surplus → deficit)
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"offset_event", &event_id],
    &pooling_engine_program_id
  )
  ```

### SixOracleState PDA
- **Seeds:** `[b"six_oracle"]`
- **Program:** pooling-engine
- **Description:** Stores current FX rates from SIX BFI (EURUSD, GBPUSD, CHFUSD, HKDUSD, AEDUSD) with timestamp
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"six_oracle"],
    &pooling_engine_program_id
  )
  ```

---

## Layer 3: Compliance Hook

### ComplianceCert PDA
- **Seeds:** `[b"compliance_cert", transfer_ref: [u8; 32]]`
- **Program:** compliance-hook
- **Description:** Records all 6 compliance checks for a transfer (KYC, mandate, AML, travel rule, KYT, timestamp)
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"compliance_cert", &transfer_ref],
    &compliance_hook_program_id
  )
  ```

### AmlOracleState PDA
- **Seeds:** `[b"aml_oracle"]`
- **Program:** compliance-hook
- **Description:** List of flagged addresses (sanctions, high-risk entities), updated by off-chain service
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"aml_oracle"],
    &compliance_hook_program_id
  )
  ```

### KytState PDA
- **Seeds:** `[b"kyt_state", entity_id: [u8; 32]]`
- **Program:** compliance-hook
- **Description:** Know-Your-Transaction state for an entity (24h rolling window of transactions & volume, moving avg)
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"kyt_state", &entity_id],
    &compliance_hook_program_id
  )
  ```

---

## Layer 4: FX Netting Engine

### FxConversionEvent PDA
- **Seeds:** `[b"fx_conversion", conversion_id: [u8; 32]]`
- **Program:** fx-netting
- **Description:** Records a cross-currency offset with SIX rate and spread captured/paid
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"fx_conversion", &conversion_id],
    &fx_netting_program_id
  )
  ```

---

## Layer 5: Sweep Trigger

### IntercompanyLoan PDA
- **Seeds:** `[b"loan", loan_id: [u8; 32]]`
- **Program:** sweep-trigger
- **Description:** Records an intercompany loan created during physical sweep (lender, borrower, principal, rate, maturity)
- **Example:**
  ```rust
  PDA::find_program_address(
    &[b"loan", &loan_id],
    &sweep_trigger_program_id
  )
  ```

---

## Client Implementation Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

function deriveEntityRecordPDA(
  entityId: Uint8Array,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("entity"), Buffer.from(entityId)],
    programId
  );
}

function deriveEntityPositionPDA(
  poolId: Uint8Array,
  entityId: Uint8Array,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("entity_position"),
      Buffer.from(poolId),
      Buffer.from(entityId),
    ],
    programId
  );
}

function deriveSixOraclePDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("six_oracle")],
    programId
  );
}
```

---

## Key Implementation Notes

1. **Bump Handling**: Every PDA account stores its bump for validation. Always pass the bump when calling `find_program_address_sync` to verify consistency.

2. **32-byte IDs**: Entity and pool IDs are [u8; 32]. Derive these as:
   - **Entity ID**: SHA256 hash of (entity_name || jurisdiction || registration_number)
   - **Pool ID**: SHA256 hash of (pool_name || creation_timestamp || admin_pubkey)
   - **Event ID**: SHA256 hash of (pool_id || entity1 || entity2 || timestamp || nonce)

3. **CPI Calls**: When calling other programs via CPI, derive the PDAs using these same seeds and pass them as `UncheckedAccount` or `Account` depending on the context.

4. **Timestamp Reference**: All timestamps are i64 Unix seconds (seconds since epoch).

5. **Currency Codes**: All 3-byte currency codes are UTF-8: b"USD", b"EUR", b"GBP", b"AED", b"CHF", b"HKD"

---

## Devnet Address Registry

After running `seed-devnet.ts`, all program IDs and PDA addresses will be output to `addresses.json`:

```json
{
  "programs": {
    "entity_registry": "...",
    "pooling_engine": "...",
    "compliance_hook": "...",
    "fx_netting": "...",
    "sweep_trigger": "..."
  },
  "mint": "...",
  "pool": {
    "id": "...",
    "address": "..."
  },
  "entities": [
    {
      "name": "Singapore",
      "id": "...",
      "record_pda": "...",
      "position_pda": "...",
      "vault": "..."
    }
  ]
}
```

This file should be committed to git for dashboard consumption.
