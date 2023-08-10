/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { remove } from 'lodash';
import { create } from 'zustand';

import { findAttachmentFiles } from '../../../helpers/attachments';
import { equalsParticipant } from '../../../helpers/participants';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	EditorAttachmentFiles,
	EditorsStateTypeV2,
	MailAttachmentParts,
	MailsEditorV2,
	SaveDraftResponse
} from '../../../types';
import { retrieveAttachmentsType } from '../../editor-slice-utils';
import { AppDispatch } from '../../redux';

// extra currying as suggested in https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md#basic-usage
export const useEditorsStore = create<EditorsStateTypeV2>()((set) => ({
	editors: {},
	addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				state.editors[id] = editor;
			})
		);
	},
	deleteEditor: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				delete state.editors[id];
			})
		);
	},
	updateEditor: (id: MailsEditorV2['id'], opt: Partial<MailsEditorV2>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id] = {
						...state.editors[id],
						...opt
					};
				}
			})
		);
	},
	updateAction: (id: MailsEditorV2['id'], action: MailsEditorV2['action']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].action = action;
				}
			})
		);
	},
	updateSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = subject;
				}
			})
		);
	},
	updateText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = text;
				}
			})
		);
	},
	updateAutoSendTime: (
		id: MailsEditorV2['id'],
		autoSendTime: MailsEditorV2['autoSendTime']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = autoSendTime;
				}
			})
		);
	},
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].did = did;
				}
			})
		);
	},
	setIsRichText: (id: MailsEditorV2['id'], value: MailsEditorV2['isRichText']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].isRichText = value;
				}
			})
		);
	},
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].originalId = originalId;
				}
			})
		);
	},
	setOriginalMessage: (
		id: MailsEditorV2['id'],
		originalMessage: MailsEditorV2['originalMessage']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].originalMessage = originalMessage;
				}
			})
		);
	},
	updateRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients = recipients;
				}
			})
		);
	},
	updateToRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['to']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.to = recipients;
				}
			})
		);
	},
	addToRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['to'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.to = [...state.editors[id].recipients.to, recipient];
				}
			})
		);
	},
	removeToRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['to'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].recipients.to, (participant) =>
						equalsParticipant(participant, recipient)
					);
				}
			})
		);
	},
	updateCcRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['cc']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.cc = recipients;
				}
			})
		);
	},
	addCcRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['cc'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.cc = [...state.editors[id].recipients.cc, recipient];
				}
			})
		);
	},
	removeCcRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['cc'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].recipients.cc, (participant) =>
						equalsParticipant(participant, recipient)
					);
				}
			})
		);
	},
	updateBccRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['bcc']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.cc = recipients;
				}
			})
		);
	},
	addBccRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['bcc'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.bcc = [...state.editors[id].recipients.bcc, recipient];
				}
			})
		);
	},
	removeBccRecipient: (
		id: MailsEditorV2['id'],
		recipient: MailsEditorV2['recipients']['bcc'][number]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].recipients.bcc, (participant) =>
						equalsParticipant(participant, recipient)
					);
				}
			})
		);
	},
	updateFrom: (id: MailsEditorV2['id'], from: MailsEditorV2['from']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].from = from;
				}
			})
		);
	},
	updateSender: (id: MailsEditorV2['id'], sender: MailsEditorV2['sender']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sender = sender;
				}
			})
		);
	},
	updateIsUrgent: (id: MailsEditorV2['id'], value: MailsEditorV2['isUrgent']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].isUrgent = value;
				}
			})
		);
	},
	updateRequestReadReceipt: (
		id: MailsEditorV2['id'],
		value: MailsEditorV2['requestReadReceipt']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].requestReadReceipt = value;
				}
			})
		);
	},
	updateDraftSaveAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveAllowedStatus = status;
				}
			})
		);
	},
	updateDraftSaveProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveProcessStatus = status;
				}
			})
		);
	},
	updateAttachmentFiles: (editorId: MailsEditorV2['id'], res: SaveDraftResponse): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (res?.m?.length) {
					const message = normalizeMailMessageFromSoap(res.m[0], true);
					const mp = retrieveAttachmentsType(message, 'attachment');
					const attachmentFiles = findAttachmentFiles(message.parts, []);
					const editor = state.editors[editorId];
					editor.attachments = { mp };
					editor.attachmentFiles = attachmentFiles;
					editor.originalId = editor.originalId ?? editor.originalMessage?.id;
					editor.did = message.id;
					editor.originalMessage = message;
				}
			})
		);
	},
	updateSendAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendAllowedStatus = status;
				}
			})
		);
	},
	updateSendProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendProcessStatus = status;
				}
			})
		);
	},
	addAttachmentFiles: (id: MailsEditorV2['id'], files: Array<EditorAttachmentFiles>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachmentFiles = [...state.editors[id].attachmentFiles, ...files];
					console.log('@@attachmentFiles', { attachmentFiles: state.editors[id].attachmentFiles });
				}
			})
		);
	},
	updateUploadProgress: (
		id: MailsEditorV2['id'],
		percentCompleted: number,
		fileUploadingId: string
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id] && fileUploadingId) {
					state.editors[id].attachmentFiles = state.editors[id].attachmentFiles.map((file) => {
						if (file.id === fileUploadingId) {
							return {
								...file,
								uploadProgress: percentCompleted
							};
						}
						return file;
					});
				}
			})
		);
	},

	addAttachment: (id: MailsEditorV2['id'], attachment: MailAttachmentParts): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = [...state.editors[id].attachments, { mp: [attachment] }];
				}
			})
		);
	},
	// TODO: properly type action
	updateAttachments: (id: MailsEditorV2['id'], action: any): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = {
						mp: retrieveAttachmentsType(
							normalizeMailMessageFromSoap(action.payload.res.m[0], true),
							'attachment'
						)
					};
				}
			})
		);
	},
	addInlineAttachment: (
		id: MailsEditorV2['id'],
		attachment: MailsEditorV2['inlineAttachments'][0]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [
						...state.editors[id].inlineAttachments,
						attachment
					];
				}
			})
		);
	},
	removeInlineAttachment: (
		id: MailsEditorV2['id'],
		attachment: MailsEditorV2['inlineAttachments'][0]
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = state.editors[id].inlineAttachments.filter(
						(att: { ci: string; attach: { aid: string } }) => att.ci !== attachment.ci
					);
				}
			})
		);
	},

	// clear

	clearEditors: (): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				state.editors = {};
			})
		);
	},
	clearSubject: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = '';
				}
			})
		);
	},
	clearAutoSendTime: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = undefined;
				}
			})
		);
	},
	clearText: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = {
						plainText: '',
						richText: ''
					};
				}
			})
		);
	},
	clearAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = { mp: [] };
					state.editors[id].attachmentFiles = [];
				}
			})
		);
	},
	clearInlineAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [];
				}
			})
		);
	},

	/**
	 * Dispatch function for messages store
	 * @param id
	 * @param dispatch
	 */
	setMessagesStoreDispatch: (id: MailsEditorV2['id'], dispatch: AppDispatch): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].messagesStoreDispatch = dispatch;
				}
			})
		);
	}
}));
