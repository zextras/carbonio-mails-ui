/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo } from 'react';

import { Button, Dropdown } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { noop } from 'lodash';

import {
	useEditorIsRichText,
	useEditorIsSmimeEncrypt,
	useEditorIsSmimeSign,
	useEditorIsUrgent,
	useEditorRequestReadReceipt
} from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';

export type OptionsDropdownProps = {
	editorId: MailsEditorV2['id'];
	onSmimeOptionChange: (isSmimeSelected: boolean) => void;
	onSmimeEncryptOptionChange: (isEncryptSelected: boolean) => void;
	isSmimeEnabled?: boolean;
};

export const OptionsDropdown: FC<OptionsDropdownProps> = ({
	editorId,
	onSmimeOptionChange,
	onSmimeEncryptOptionChange,
	isSmimeEnabled = false
}) => {
	const { isRichText, setIsRichText } = useEditorIsRichText(editorId);
	const { isUrgent, setIsUrgent } = useEditorIsUrgent(editorId);
	const { requestReadReceipt, setRequestReadReceipt } = useEditorRequestReadReceipt(editorId);
	const { isSmimeSign } = useEditorIsSmimeSign(editorId);
	const { isSmimeEncrypt } = useEditorIsSmimeEncrypt(editorId);

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
		onSmimeOptionChange(!isSmimeSign);
	}, [isSmimeSign, onSmimeOptionChange]);

	const toggleUseSmimeEncryptCertificateRequest = useCallback(() => {
		onSmimeEncryptOptionChange(!isSmimeEncrypt);
	}, [isSmimeEncrypt, onSmimeEncryptOptionChange]);

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
			...(isSmimeEnabled
				? [
						{
							id: 'is_smimesign',
							label: isSmimeSign
								? t(
										'composer.uploadCertificate.removeCertificateToSign',
										'Remove certificate to sign (S/MIME)'
									)
								: t(
										'composer.uploadCertificate.useCertificateToSign',
										'Use certificate to sign (S/MIME)'
									),
							onClick: toggleUseSmimeCertificateRequest
						},
						{
							id: 'is_smime_encrypt',
							label: isSmimeEncrypt
								? t(
										'composer.uploadCertificate.removeCertificateToEncrypt',
										'Remove certificate to encrypt (S/MIME)'
									)
								: t(
										'composer.uploadCertificate.useCertificateToEncrypt',
										'Use certificate to encrypt (S/MIME)'
									),
							onClick: toggleUseSmimeEncryptCertificateRequest
						}
					]
				: []),
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
			isSmimeEnabled,
			isSmimeSign,
			toggleUseSmimeCertificateRequest,
			isSmimeEncrypt,
			toggleUseSmimeEncryptCertificateRequest,
			requestReadReceipt,
			toggleReceiptRequest
		]
	);

	return (
		<Dropdown items={options} selectedBackgroundColor={'gray5'} data-testid="options-dropdown">
			<Button
				data-testid="options-dropdown-icon"
				size="large"
				type={'ghost'}
				color={'gray0'}
				icon="MoreVertical"
				onClick={noop}
			/>
		</Dropdown>
	);
};
