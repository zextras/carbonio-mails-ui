import { getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NO_ACCOUNT_NAME } from 'constants/index';
import { getAvailableAddresses } from 'helpers/get-available-addresses';
import type { Mock } from 'vitest';

describe('getAvailableAddresses', () => {
	const primaryAccountAddress = 'primary@example.com';
	it('should return primary account address when defined', () => {
		(getUserAccount as Mock).mockReturnValue({ name: primaryAccountAddress });
		(getUserSettings as Mock).mockReturnValue({ attrs: {} });

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress }
		]);
	});

	it('should return primary account address with no account name(NO_ACCOUNT_NAME) when account is null', () => {
		(getUserAccount as Mock).mockReturnValue(null);
		(getUserSettings as Mock).mockReturnValue({ attrs: {} });

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: NO_ACCOUNT_NAME, type: 'primary', ownerAccount: NO_ACCOUNT_NAME }
		]);
	});

	it('should return primary account address and aliases when they are defined in zimbraMailAlias', () => {
		(getUserAccount as Mock).mockReturnValue({ name: primaryAccountAddress });
		(getUserSettings as Mock).mockReturnValue({
			attrs: { zimbraMailAlias: ['alias1@example.com', 'alias2@example.com'] }
		});

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{ address: 'alias1@example.com', type: 'alias', ownerAccount: primaryAccountAddress },
			{ address: 'alias2@example.com', type: 'alias', ownerAccount: primaryAccountAddress }
		]);
	});

	it('should return primary account address and single alias when only one is defined in zimbraMailAlias', () => {
		(getUserAccount as Mock).mockReturnValue({ name: primaryAccountAddress });
		(getUserSettings as Mock).mockReturnValue({
			attrs: { zimbraMailAlias: 'alias@example.com' }
		});

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{ address: 'alias@example.com', type: 'alias', ownerAccount: primaryAccountAddress }
		]);
	});

	it('should return primary account address and delegation addresses when the delegation rights are defined', () => {
		(getUserAccount as Mock).mockReturnValue({
			name: primaryAccountAddress,
			rights: {
				targets: [
					{
						right: 'sendAs',
						target: [{ type: 'account', email: [{ addr: 'delegation1@example.com' }] }]
					},
					{
						right: 'sendOnBehalfOf',
						target: [{ type: 'account', email: [{ addr: 'delegation2@example.com' }] }]
					}
				]
			}
		});
		(getUserSettings as Mock).mockReturnValue({ attrs: {} });

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{
				address: 'delegation1@example.com',
				type: 'delegation',
				right: 'sendAs',
				ownerAccount: 'delegation1@example.com'
			},
			{
				address: 'delegation2@example.com',
				type: 'delegation',
				right: 'sendOnBehalfOf',
				ownerAccount: 'delegation2@example.com'
			}
		]);
	});

	it('should return primary account address, aliases, and delegation addresses', () => {
		(getUserAccount as Mock).mockReturnValue({
			name: primaryAccountAddress,
			rights: {
				targets: [
					{
						right: 'sendAs',
						target: [
							{ type: 'account', email: [{ addr: 'delegation1@example.com' }] },
							{ type: 'account', email: [{ addr: 'delegation2@example.com' }] }
						]
					}
				]
			}
		});
		(getUserSettings as Mock).mockReturnValue({
			attrs: { zimbraMailAlias: ['alias1@example.com', 'alias2@example.com'] }
		});

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{ address: 'alias1@example.com', type: 'alias', ownerAccount: primaryAccountAddress },
			{ address: 'alias2@example.com', type: 'alias', ownerAccount: primaryAccountAddress },
			{
				address: 'delegation1@example.com',
				type: 'delegation',
				right: 'sendAs',
				ownerAccount: 'delegation1@example.com'
			},
			{
				address: 'delegation2@example.com',
				type: 'delegation',
				right: 'sendAs',
				ownerAccount: 'delegation2@example.com'
			}
		]);
	});

	it('should return primary account address and no delegation addresses when the delegation rights are different then sendAs and sendOnBehalfOf', () => {
		(getUserAccount as Mock).mockReturnValue({
			name: primaryAccountAddress,
			rights: {
				targets: [
					{
						right: 'sendAsDistList',
						target: [{ type: 'account', email: [{ addr: 'delegation1@example.com' }] }]
					},
					{
						right: 'viewFreeBusy',
						target: [{ type: 'account', email: [{ addr: 'delegation2@example.com' }] }]
					},
					{
						right: 'sendOnBehalfOfDistList',
						target: [{ type: 'account', email: [{ addr: 'delegation3@example.com' }] }]
					}
				]
			}
		});
		(getUserSettings as Mock).mockReturnValue({ attrs: {} });

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{
				address: 'delegation1@example.com',
				ownerAccount: 'delegation1@example.com',
				right: 'sendAsDistList',
				type: 'delegation'
			},
			{
				address: 'delegation3@example.com',
				ownerAccount: 'delegation3@example.com',
				right: 'sendOnBehalfOfDistList',
				type: 'delegation'
			}
		]);
	});

	it('should return distribution list address and no delegation addresses when the delegation rights are different then sendAs and sendOnBehalfOf', () => {
		(getUserAccount as Mock).mockReturnValue({
			name: primaryAccountAddress,
			rights: {
				targets: [
					{
						right: 'sendAsDistList',
						target: [{ type: 'dl', email: [{ addr: 'delegation1@example.com' }] }]
					},
					{
						right: 'viewFreeBusy',
						target: [{ type: 'dl', email: [{ addr: 'delegation2@example.com' }] }]
					},
					{
						right: 'sendOnBehalfOfDistList',
						target: [{ type: 'dl', email: [{ addr: 'delegation3@example.com' }] }]
					}
				]
			}
		});
		(getUserSettings as Mock).mockReturnValue({ attrs: {} });

		const result = getAvailableAddresses();

		expect(result).toEqual([
			{ address: primaryAccountAddress, type: 'primary', ownerAccount: primaryAccountAddress },
			{
				address: 'delegation1@example.com',
				ownerAccount: primaryAccountAddress,
				right: 'sendAsDistList',
				type: 'delegation'
			},
			{
				address: 'delegation3@example.com',
				ownerAccount: primaryAccountAddress,
				right: 'sendOnBehalfOfDistList',
				type: 'delegation'
			}
		]);
	});
});
