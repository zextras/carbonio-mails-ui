/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CreateSnackbarFn } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { find } from 'lodash';

import { createSmartLinksSoapAPI } from '../store/actions/create-smart-links';
import { useEditorsStore } from '../store/zustand/editor/store';
import type {
	CreateSmartLinksResponse,
	SmartLinkUrl,
	Conversation,
	MailMessage,
	MailsEditorV2,
	MessageAction
} from '../types';

type GetFolderParentIdProps = {
	folderId: string;
	isConversation: boolean;
	items: Array<Partial<MailMessage> & Pick<MailMessage, 'id'>> | Array<Conversation>;
};

// FIXME the function name and the parameters are misleading
// FIXME this function implementation is strictly linked to the
//  search list and multiple selection list. Should be moved
//  closer to them
export function getFolderParentId({
	folderId,
	isConversation,
	items
}: GetFolderParentIdProps): string {
	if (folderId) return folderId;
	if (isConversation) return (items as Conversation[])?.[0]?.messages?.[0]?.parent;
	return (items as MailMessage[])?.[0]?.parent;
}

/**
 *
 * @param actions
 * @param id
 */
export const findMessageActionById = (
	actions: Array<MessageAction>,
	id: string
): MessageAction | undefined => {
	if (!actions || !actions.length) {
		return undefined;
	}

	return find(actions, ['id', id]);
};

/**
 * Generate the html for the smart link
 */
export const generateSmartLinkHtml = ({
	smartLink,
	filename
}: {
	smartLink: SmartLinkUrl;
	filename: MailsEditorV2['savedAttachments'][0]['filename'];
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
border: 1px solid #2b73d2;'
 href='${smartLink.publicUrl}' download>${filename ?? smartLink.publicUrl}</a>`;

/**
 * Add smart links to the text of the editor
 * both in plain text and rich text
 */
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
		plainText: text.plainText.concat(
			response.smartLinks.map((smartLink) => smartLink.publicUrl).join('\n')
		),
		richText: text.richText.concat(
			` ${response.smartLinks
				.map((smartLink, index) =>
					generateSmartLinkHtml({
						smartLink,
						filename: attachments[index]?.filename
					})
				)
				.join('<br/>')}`
		)
	};
}

/**
 * Create smart links for the attachments that require it
 * once obtained the response, the text of the editor is updated with the smart links
 * the attachments that have been converted are removed from the saved attachments
 * @param editorId
 * @param onResponseCallback
 * @param createSnackbar
 * @param t
 * @returns Promise<void>
 */
export async function updateEditorWithSmartLinks({
	onResponseCallback,
	createSnackbar,
	t,
	editorId
}: {
	onResponseCallback?: () => void;
	editorId: MailsEditorV2['id'];
	createSnackbar: CreateSnackbarFn;
	t: TFunction;
}): Promise<void> {
	const savedStandardAttachments = useEditorsStore.getState().editors[editorId].savedAttachments;

	const attachmentsToConvert = savedStandardAttachments
		.filter((attachment) => attachment.requiresSmartLinkConversion)
		.map((attachment) => ({ draftId: attachment.messageId, partName: attachment.partName }));

	const result = await createSmartLinksSoapAPI(attachmentsToConvert);

	onResponseCallback && onResponseCallback();
	if ('Fault' in result) {
		createSnackbar({
			key: `save-draft`,
			replace: true,
			type: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: 3000
		});
	} else {
		const { text } = useEditorsStore.getState().editors[editorId];

		const attachmentsToAddToBody = savedStandardAttachments.filter(
			(attachment) => attachment.requiresSmartLinkConversion
		);

		const textWithLinks = addSmartLinksToText({
			response: result,
			text,
			attachments: attachmentsToAddToBody
		});
		useEditorsStore.getState().setText(editorId, textWithLinks);
		const { removeSavedAttachment } = useEditorsStore.getState();
		attachmentsToConvert.forEach((smartLink) => {
			removeSavedAttachment(editorId, smartLink.partName);
		});
	}
}
