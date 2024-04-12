/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { t, SettingsSubSection } from '@zextras/carbonio-shell-ui';

import { PRODUCT_FLAVOUR } from '../../constants';
import { useProductFlavorStore } from '../../store/zustand/product-flavor/store';

export const displayingMessagesSubSection = (): SettingsSubSection => ({
	label: t('settings.label.display_messages', 'Displaying Messages'),
	id: 'displaying_messages'
});

const productflavour = useProductFlavorStore.getState().productFlavor;

export const receivingMessagesSubSection = (): SettingsSubSection => ({
	label: t('label.receive_message', 'Receiving Messages'),
	id: 'receiving_messages'
});

export const recoverMessagesSubSection = (): SettingsSubSection => ({
	label: t('label.recover_messages', 'Recover Messages'),
	id: 'recover_messages'
});

export const domainWhitelistSubSection = (): SettingsSubSection => ({
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

export const getSettingsSubSections = (): Array<SettingsSubSection> =>
	[displayingMessagesSubSection(), receivingMessagesSubSection()]
		.concat(productflavour === PRODUCT_FLAVOUR.ADVANCED ? recoverMessagesSubSection() : [])
		.concat([signaturesSubSection(), setDefaultSignaturesSubSection(), filtersSubSection()]);

export const composingMsgSubSection = (): SettingsSubSection => ({
	label: t('labels.composing_messages', 'Composing Messages'),
	id: 'compose'
});
