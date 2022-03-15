/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TFunction } from 'react-i18next';
// this ignore can be removed after the next rc
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SettingsSubSection } from '@zextras/carbonio-shell-ui';

export const displayingMessagesSubSection = (t: TFunction): SettingsSubSection => ({
	label: t('settings.label.display_messages', 'Displaying Messages'),
	id: 'displaying_messages'
});
export const receivingMessagesSubSection = (t: TFunction): SettingsSubSection => ({
	label: t('label.receive_message', 'Receiving Messages'),
	id: 'receiving_messages'
});
export const signaturesSubSection = (t: TFunction): SettingsSubSection => ({
	label: t('signatures.signature_heading', 'Signatures'),
	id: 'signatures'
});
export const setDefaultSignaturesSubSection = (t: TFunction): SettingsSubSection => ({
	label: t('label.set_default_signatures', 'Set Default Signatures'),
	id: 'set_default_signatures'
});
export const filtersSubSection = (t: TFunction): SettingsSubSection => ({
	label: t('filters.filters', 'Filters'),
	id: 'filters'
});

export const getSettingsSubSections = (t: TFunction): Array<SettingsSubSection> => [
	displayingMessagesSubSection(t),
	receivingMessagesSubSection(t),
	signaturesSubSection(t),
	setDefaultSignaturesSubSection(t),
	filtersSubSection(t)
];
