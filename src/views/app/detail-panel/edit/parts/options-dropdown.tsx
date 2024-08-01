/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Dropdown, IconButton } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import {
	useEditorIsRichText,
	useEditorIsSmimeSign,
	useEditorIsUrgent,
	useEditorRequestReadReceipt
} from '../../../../../store/zustand/editor';
import { MailsEditorV2 } from '../../../../../types';

export type OptionsDropdownProps = {
	editorId: MailsEditorV2['id'];
};

export const OptionsDropdown: FC<OptionsDropdownProps> = ({ editorId }) => {
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { isUrgent, setIsUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt, setRequestReadReceipt } = useEditorRequestReadReceipt(editorId);
	const { isSmimeSign, setIsSmimeSign } = useEditorIsSmimeSign(editorId);

	const toggleRichTextEditor = useCallback(() => {
		setIsRichText(!isRichText);
	}, [isRichText, setIsRichText]);

	const toggleImportant = useCallback(() => {
		setIsUrgent(!isUrgent);
	}, [isUrgent, setIsUrgent]);

	const toggleReceiptRequest = useCallback(() => {
		setRequestReadReceipt(!requestReadReceipt);
	}, [requestReadReceipt, setRequestReadReceipt]);

	const toggleUseSmimeCertificateRequest = useCallback(() => {
		setIsSmimeSign(!isSmimeSign);
	}, [isSmimeSign, setIsSmimeSign]);

	const options = useMemo(
		() => [
			{
				id: 'richText',
				label: isRichText
					? t('tooltip.disable_rich_text', 'Disable rich text editor')
					: t('tooltip.enable_rich_text', 'Enable rich text editor'),
				onClick: toggleRichTextEditor
			},
			{
				id: 'urgent',
				label: isUrgent
					? t('label.mark_as_un_important', 'Mark as unimportant')
					: t('label.mark_as_important', 'Mark as important'),
				onClick: toggleImportant
			},
			{
				id: 'is_smimesign',
				label: isSmimeSign
					? t('label.remove_use_certificate_to_sign', 'Remove certificate to sign (S/MIME)')
					: t('label.use_certificate_to_sign', 'Use certificate to sign (S/MIME)'),
				onClick: toggleUseSmimeCertificateRequest
			},
			{
				id: 'read_receipt',
				label: requestReadReceipt
					? t('label.remove_request_receipt', 'Remove read receipt request')
					: t('label.request_receipt', 'Request read receipt'),
				onClick: toggleReceiptRequest
			}
		],
		[
			isRichText,
			toggleRichTextEditor,
			isUrgent,
			toggleImportant,
			isSmimeSign,
			toggleUseSmimeCertificateRequest,
			requestReadReceipt,
			toggleReceiptRequest
		]
	);

	return (
		<Dropdown items={options} selectedBackgroundColor={'gray5'} data-testid="options-dropdown">
			<IconButton
				data-testid="options-dropdown-icon"
				size="large"
				icon="MoreVertical"
				onClick={noop}
			/>
		</Dropdown>
	);
};
