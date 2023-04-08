use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{collections::UnorderedMap, env, log, near_bindgen, AccountId};
use serde::{Deserialize, Serialize};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    pub accounts: UnorderedMap<AccountId, Vec<Audit>>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Debug, Serialize, Deserialize, Clone)]
pub struct Audit {
    id: u64,
    github_name: String,
    audit_description: String,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Debug, Serialize, Deserialize, Clone)]
pub struct Account {
    pub account_id: AccountId,
    pub audits: Vec<Audit>,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            accounts: UnorderedMap::new(b"d"),
        }
    }
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_account(&mut self, account_id: AccountId) {
        self.accounts.insert(&account_id, &Vec::new());
    }

    pub fn get_account(&self, account_id: AccountId) -> Account {
        let audits = self.accounts.get(&account_id).unwrap_or_default();
        Account { account_id, audits }
    }

    pub fn add_audit(&mut self, github_name: String, audit_description: String) {
        let id = self.accounts.len() as u64;
        let audit = Audit {
            id,
            github_name,
            audit_description,
        };

        let mut audits = self
            .accounts
            .get(&env::current_account_id())
            .unwrap_or_default();

        audits.push(audit);
        log!("audits: {:?}", audits);

        // insert the updated list of audits into the unordered map if the account exists
        self.accounts.insert(&env::current_account_id(), &audits);
    }

    pub fn get_audit(&self, id: u64) -> Option<Audit> {
        let audits = self
            .accounts
            .get(&env::predecessor_account_id())
            .unwrap_or_default();
        audits.into_iter().find(|audit| audit.id == id)
    }

    pub fn get_audits_by_account(&self) -> Vec<Audit> {
        log!("Current account id: {}", env::current_account_id());
        self.accounts
            .get(&env::current_account_id())
            .unwrap_or_default()
    }
}
