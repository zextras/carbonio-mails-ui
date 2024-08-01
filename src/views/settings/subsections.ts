/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, SettingsSubSection } from '@zextras/carbonio-shell-ui';

import { AdvancedAccountStore } from '../../store/zustand/advanced-account/store';

export const displayingMessagesSubSection = (): SettingsSubSection => ({
	label: t('settings.label.display_messages', 'Displaying Messages'),
	id: 'displaying_messages'
});

export const receivingMessagesSubSection = (): SettingsSubSection => ({
	label: t('label.receive_message', 'Receiving Messages'),
	id: 'receiving_messages'
});

export const recoverMessagesSubSection = (): SettingsSubSection => ({
	label: t('label.recover_messages', 'Recover Messages'),
	id: 'recover_messages'
});

export const trustedAddressesSubSection = (): SettingsSubSection => ({
	label: t('label.trusted_addresses', 'Trusted addresses'),
	id: 'trusted_addresses'
});
export const signaturesSubSection = (): SettingsSubSection => ({
	label: t('signatures.signature_heading', 'Signatures'),
	id: 'signatures'
});
export const setDefaultSignaturesSubSection = (): SettingsSubSection => ({
	label: t('label.using_signatures', 'Signatures Usage'),
	id: 'using_signatures'
});
export const filtersSubSection = (): SettingsSubSection => ({
	label: t('filters.filters', 'Filters'),
	id: 'filters'
});

export const allowedSendersSubSection = (): SettingsSubSection => ({
	label: t('label.allowed_addresses', 'Allowed senders list'),
	id: 'allowed_addresses'
});

export const blockedSendersSubSection = (): SettingsSubSection => ({
	label: t('label.blocked_addresses', 'Blocked senders list'),
	id: 'blocked_addresses'
});

export const sMimeCertificateSubSection = (): SettingsSubSection => ({
	label: t('label.smime_certificate', 'S/MIME Certificate'),
	id: 'smime_certificate'
});

export const getSettingsSubSections = (
	backupSelfUndeleteAllowed: AdvancedAccountStore['backupSelfUndeleteAllowed']
): Array<SettingsSubSection> =>
	[displayingMessagesSubSection(), receivingMessagesSubSection()]
		.concat(backupSelfUndeleteAllowed ? recoverMessagesSubSection() : [])
		.concat([
			signaturesSubSection(),
			setDefaultSignaturesSubSection(),
			sMimeCertificateSubSection(),
			filtersSubSection(),
			trustedAddressesSubSection(),
			allowedSendersSubSection(),
			blockedSendersSubSection()
		]);

export const composingMsgSubSection = (): SettingsSubSection => ({
	label: t('labels.composing_messages', 'Composing Messages'),
	id: 'compose'
});
