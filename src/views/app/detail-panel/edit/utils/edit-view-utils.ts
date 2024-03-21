/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CreateSnackbarFn } from '@zextras/carbonio-design-system';
import { soapFetch } from '@zextras/carbonio-shell-ui';
import { TFunction } from 'i18next';

import { MailMessage, MailsEditorV2 } from '../../../../../types';
import {
	CreateSmartLinksRequest,
	CreateSmartLinksResponse,
	SmartLinkUrl
} from '../../../../../types/soap/create-smart-links';

export const generateSmartLinkHtml = ({
	smartLink,
	attachments,
	index
}: {
	smartLink: SmartLinkUrl;
	attachments: MailsEditorV2['savedAttachments'];
	index: number;
}): string =>
	`<a style='background-color: #D3EBF8; 
                            padding: 7px 15px;
                            color: black;
                            display: inline-block;
                            margin-top: 5px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            overflow: hidden;
                            max-width: 80%;
                            border: 1px solid #2b73d2;
                            href='${smartLink.publicUrl}' download>${
		attachments[index].filename ?? smartLink.publicUrl
	}</a>`;

export function addSmartLinksToText({
	response,
	text,
	attachments
}: {
	response: CreateSmartLinksResponse;
	text: MailsEditorV2['text'];
	attachments: MailsEditorV2['savedAttachments'];
}): MailsEditorV2['text'] {
	return {
		plainText: response.smartLinks
			.map((smartLink) => smartLink.publicUrl)
			.join('\n')
			.concat(text.plainText),
		richText: text.richText.concat(
			` ${response.smartLinks
				.map((smartLink, index) =>
					generateSmartLinkHtml({
						smartLink,
						attachments,
						index
					})
				)
				.join('<br/>')}`
		)
	};
}

export async function createSmartLinkSoap({
	savedStandardAttachments,
	onResponseCallback,
	createSnackbar,
	t,
	text,
	removeSavedAttachment,
	setText
}: {
	onResponseCallback?: () => void;
	createSnackbar: CreateSnackbarFn;
	t: TFunction;
	text: MailsEditorV2['text'];
	setText: (text: MailsEditorV2['text']) => void;
	savedStandardAttachments: MailsEditorV2['savedAttachments'];
	removeSavedAttachment: (partName: string) => void;
}): Promise<void> {
	const draftSmartLinks = savedStandardAttachments
		.filter((attachment) => attachment.requiresSmartLinkConversion)
		.map((attachment) => ({ draftId: attachment.messageId, partName: attachment.partName }));
	return soapFetch<CreateSmartLinksRequest, CreateSmartLinksResponse>('CreateSmartLinks', {
		_jsns: 'urn:zimbraMail',
		attachments: draftSmartLinks
	}).then((response) => {
		onResponseCallback && onResponseCallback();
		if ('Fault' in response) {
			createSnackbar({
				key: `save-draft`,
				replace: true,
				type: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
		} else {
			setText(addSmartLinksToText({ response, text, savedStandardAttachments }));
			draftSmartLinks.forEach((smartLink) => {
				removeSavedAttachment(smartLink.partName);
			});
			createSnackbar({
				key: 'smartLinksCreated',
				replace: true,
				type: 'success',
				label: t('label.smart_links_created', 'smart links created'),
				autoHideTimeout: 3000
			});
		}
	});
}

export async function createSmartLinkFromMsgSoap({
	message,
	createSnackbar,
	t
}: {
	message: MailMessage;
	createSnackbar: CreateSnackbarFn;
	t: TFunction;
}): Promise<CreateSmartLinksResponse> {
	const draftSmartLinks =
		message.attachments
			?.filter((attachment) => attachment.requiresSmartLinkConversion)
			.map((attachment) => ({
				draftId: message.did as string,
				partName: attachment.part as string
			})) ?? [];
	return soapFetch<CreateSmartLinksRequest, CreateSmartLinksResponse>('CreateSmartLinks', {
		_jsns: 'urn:zimbraMail',
		attachments: draftSmartLinks
	}).then((response) => {
		if ('Fault' in response) {
			createSnackbar({
				key: `save-draft`,
				replace: true,
				type: 'error',
				label: t('label.error_try_again', 'Something went wrong, please try again'),
				autoHideTimeout: 3000
			});
			return response;
		}
		createSnackbar({
			key: 'smartLinksCreated',
			replace: true,
			type: 'success',
			label: t('label.smart_links_created', 'smart links created'),
			autoHideTimeout: 3000
		});
		return response;
	});
}
