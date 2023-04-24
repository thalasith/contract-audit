
near call dev-1680974591130-26022271810932 add_account '{"account_id": "thalassiel.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_account '{"account_id": "thalassiel.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 add_audit '{"github_name": "flight_shield", "audit_description": "testing audit description"}' --accountId thalassiel.testnet

near call dev-1682295617698-65147447957050 get_audits_by_account '{"account_id": "1682297878052-keypom.testnet"}' --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_audits_by_account --accountId thalassiel.testnet

near call dev-1680974591130-26022271810932 get_audit_by_repo '{"github_name": "book-rentals"}' --accountId thalassiel.testnet