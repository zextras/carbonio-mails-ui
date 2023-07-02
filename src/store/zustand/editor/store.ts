/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import produce from 'immer';
import { create } from 'zustand';
import { AttachmentPart, EditorsStateTypeV2, MailsEditorV2 } from '../../../types';

// extra currying as suggested in https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md#basic-usage
export const useEditorsStore = create<EditorsStateTypeV2>()((set) => ({
	editors: {},
	addEditor: (id: MailsEditorV2['id'], editor: MailsEditorV2): void => {
		set(
			produce((state) => {
				state.editors[id] = editor;
			})
		);
	},
	deleteEditor: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				delete state.editors[id];
			})
		);
	},
	updateEditor: (id: MailsEditorV2['id'], opt: Partial<MailsEditorV2>): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id] = {
						...state.editors[id],
						...opt
					};
				}
			})
		);
	},
	updateSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = subject;
				}
			})
		);
	},
	updateText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']): void => {
		set(
			produce((state) => {
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
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = autoSendTime;
				}
			})
		);
	},
	setDid: (id: MailsEditorV2['id'], did: MailsEditorV2['did']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].did = did;
				}
			})
		);
	},
	setIsRichText: (id: MailsEditorV2['id'], value: MailsEditorV2['isRichText']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].richText = value;
				}
			})
		);
	},
	setOriginalId: (id: MailsEditorV2['id'], originalId: MailsEditorV2['originalId']): void => {
		set(
			produce((state) => {
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
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].originalMessage = originalMessage;
				}
			})
		);
	},
	updateRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id] && !!recipients.to) {
					state.editors[id].recipients.to = recipients.to;
				}
				if (state?.editors?.[id] && !!recipients.cc) {
					state.editors[id].recipients.cc = recipients.cc;
				}
				if (state?.editors?.[id] && !!recipients.bcc) {
					state.editors[id].recipients.bcc = recipients.bcc;
				}
			})
		);
	},
	updateFrom: (id: MailsEditorV2['id'], from: MailsEditorV2['from']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].from = from;
				}
			})
		);
	},
	updateIsUrgent: (id: MailsEditorV2['id'], value: MailsEditorV2['isUrgent']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].isUrgent = value;
				}
			})
		);
	},
	addAttachments: (id: MailsEditorV2['id'], attachments: MailsEditorV2['attachments']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = [...state.editors[id].attachments, ...attachments];
				}
			})
		);
	},
	removeAttachments: (id: MailsEditorV2['id'], attachments: MailsEditorV2['attachments']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = state.editors[id].attachments.filter(
						(attachment: AttachmentPart) => !attachments.includes(attachment)
					);
				}
			})
		);
	},
	addInlineAttachments: (
		id: MailsEditorV2['id'],
		attachments: MailsEditorV2['inlineAttachments']
	): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [
						...state.editors[id].inlineAttachments,
						...attachments
					];
				}
			})
		);
	},
	removeInlineAttachments: (
		id: MailsEditorV2['id'],
		attachments: MailsEditorV2['inlineAttachments']
	): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = state.editors[id].inlineAttachments.filter(
						(attachment: { ci: string; attach: { aid: string } }) =>
							!attachments.includes(attachment)
					);
				}
			})
		);
	},

	// clear

	clearEditors: (): void => {
		set(
			produce((state) => {
				state.editors = {};
			})
		);
	},
	clearSubject: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = '';
				}
			})
		);
	},
	clearAutoSendTime: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].autoSendTime = null;
				}
			})
		);
	},
	clearText: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = '';
				}
			})
		);
	},
	clearAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].attachments = [];
					state.editors[id].inlineAttachments = [];
				}
			})
		);
	},
	clearInlineAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state) => {
				if (state?.editors?.[id]) {
					state.editors[id].inlineAttachments = [];
				}
			})
		);
	}
}));
