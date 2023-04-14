
near call dev-1680974591130-26022271810932 add_account '{"account_id": "thalassiel.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_account '{"account_id": "thalassiel.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 add_audit '{"github_name": "flight_shield", "audit_description": "testing audit description"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_audits_by_account '{"account_id": "1681361376026-keypom.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_audits_by_account --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_audit_by_repo '{"github_name": "book-rentals"}' --accountId thalassiel.testnet