/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account } from '@zextras/carbonio-shell-ui';

import { getMocksContext } from '../utils/mocks-context';

/**
 * Generate an account consistent data based on the current mocksContext
 */
const defaultAccount = (): Account => {
	const mockedContext = getMocksContext();
	const { primary, aliases, sendAs, sendOnBehalf } = mockedContext.identities;
	const { viewFreeBusyIdentities } = mockedContext;

	// Collect all the account's available signatures
	const allSignatures: Account['signatures']['signature'] = [];
	[primary, ...aliases, ...sendAs, ...sendOnBehalf].forEach((identityContext) => {
		const combinedSignatures = [
			...(identityContext.signatures?.newEmailSignature
				? [identityContext.signatures.newEmailSignature]
				: []),
			...(identityContext.signatures?.forwardReplySignature
				? [identityContext.signatures.forwardReplySignature]
				: [])
		];
		allSignatures.push(
			...combinedSignatures.map((signature) => ({
				name: signature.name,
				id: signature.id,
				content: signature.content
			}))
		);
	});

	return {
		id: primary.identity.id,
		name: primary.identity.email,
		displayName: primary.identity.fullName,
		identities: {
			identity: [
				{
					id: primary.identity.id,
					name: 'DEFAULT',
					_attrs: {
						zimbraPrefIdentityName: 'DEFAULT',
						zimbraPrefIdentityId: '1',
						zimbraPrefWhenSentToEnabled: 'FALSE',
						zimbraPrefWhenInFoldersEnabled: 'FALSE',
						zimbraPrefFromAddressType: 'sendAs',
						zimbraPrefFromAddress: primary.identity.email,
						zimbraPrefFromDisplay: primary.identity.fullName,
						zimbraPrefReplyToEnabled: 'FALSE',
						zimbraPrefDefaultSignatureId: primary.signatures?.newEmailSignature?.id,
						zimbraPrefForwardReplySignatureId: primary.signatures?.forwardReplySignature?.id
					}
				},
				...[...aliases, ...sendAs, ...sendOnBehalf].map((identityContext, index) => ({
					id: identityContext.identity.id,
					name: identityContext.identity.fullName,
					_attrs: {
						zimbraPrefFromAddressType: 'sendAs',
						zimbraPrefIdentityName: identityContext.identity.fullName,
						zimbraPrefIdentityId: `${index + 1}`,
						zimbraPrefWhenSentToEnabled: 'FALSE',
						zimbraPrefWhenInFoldersEnabled: 'FALSE',
						zimbraPrefFromAddress: identityContext.identity.email,
						zimbraPrefFromDisplay: identityContext.identity.fullName,
						zimbraPrefReplyToEnabled: 'FALSE',
						zimbraPrefDefaultSignatureId: identityContext.signatures?.newEmailSignature?.id,
						zimbraPrefForwardReplySignatureId: identityContext.signatures?.forwardReplySignature?.id
					} as const
				}))
			]
		},
		signatures: {
			signature: allSignatures
		},
		rights: {
			targets: [
				{
					right: 'sendAs',
					target: sendAs.map((identityContext, index) => ({
						id: `${index}`,
						name: identityContext.identity.fullName,
						type: 'account',
						email: [
							{
								addr: identityContext.identity.email
							}
						],
						d: identityContext.identity.fullName
					}))
				},
				{
					right: 'sendOnBehalfOf',
					target: sendOnBehalf.map((identityContext, index) => ({
						id: `${index}`,
						name: identityContext.identity.fullName,
						type: 'account',
						email: [
							{
								addr: identityContext.identity.email
							}
						],
						d: identityContext.identity.fullName
					}))
				},
				{
					right: 'viewFreeBusy',
					target: viewFreeBusyIdentities.map((identity, index) => ({
						id: `${index}`,
						name: identity.fullName,
						type: 'account',
						email: [
							{
								addr: identity.email
							}
						],
						d: identity.fullName
					}))
				}
			]
		}
	};
};
export { defaultAccount };
