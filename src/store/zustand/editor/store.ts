/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { produce } from 'immer';
import { find, remove } from 'lodash';
import { create } from 'zustand';

import { filterSavedInlineAttachment, filterUnsavedInlineAttachment } from './editor-utils';
import { getUnsavedAttachmentIndex } from './store-utils';
import {
	AttachmentUploadProcessStatus,
	EditorsStateTypeV2,
	MailsEditorV2,
	SavedAttachment,
	UnsavedAttachment
} from '../../../types';
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
	setSubject: (id: MailsEditorV2['id'], subject: MailsEditorV2['subject']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].subject = subject;
				}
			})
		);
	},
	setText: (id: MailsEditorV2['id'], text: MailsEditorV2['text']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].text = text;
				}
			})
		);
	},
	setAutoSendTime: (id: MailsEditorV2['id'], autoSendTime: MailsEditorV2['autoSendTime']): void => {
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
	setSize: (id: MailsEditorV2['id'], size: MailsEditorV2['size']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].size = size;
				}
			})
		);
	},
	setTotalSmartLinksSize: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					const currentEditor = state?.editors?.[id];
					const { savedAttachments } = currentEditor;
					const totalSmartLinksSize = savedAttachments.reduce(
						(acc, attachment) =>
							attachment.requiresSmartLinkConversion ? acc + attachment.size : acc,
						0
					);
					currentEditor.totalSmartLinksSize = totalSmartLinksSize;
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
	setRecipients: (id: MailsEditorV2['id'], recipients: MailsEditorV2['recipients']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients = recipients;
				}
			})
		);
	},
	setToRecipients: (
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
	setCcRecipients: (
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
	setBccRecipients: (
		id: MailsEditorV2['id'],
		recipients: MailsEditorV2['recipients']['bcc']
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].recipients.bcc = recipients;
				}
			})
		);
	},
	setIdentityId: (id: MailsEditorV2['id'], from: MailsEditorV2['identityId']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].identityId = from;
				}
			})
		);
	},
	setIsUrgent: (id: MailsEditorV2['id'], value: MailsEditorV2['isUrgent']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].isUrgent = value;
				}
			})
		);
	},
	setRequestReadReceipt: (
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
	setDraftSaveAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveAllowedStatus = status;
				}
			})
		);
	},
	setDraftSaveProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].draftSaveProcessStatus = status;
				}
			})
		);
	},
	setSendAllowedStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendAllowedStatus = status;
				}
			})
		);
	},
	setSendProcessStatus: (id, status): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].sendProcessStatus = status;
				}
			})
		);
	},
	toggleSmartLink: (id: MailsEditorV2['id'], partName: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				const currentEditor = state?.editors?.[id];
				if (!currentEditor) {
					return;
				}

				const attachment = find(currentEditor.savedAttachments, ['partName', partName]);
				if (attachment) {
					attachment.requiresSmartLinkConversion = !attachment.requiresSmartLinkConversion;
				}
			})
		);
	},
	setSavedAttachments: (id: MailsEditorV2['id'], attachment: Array<SavedAttachment>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].savedAttachments = [...attachment];
				}
			})
		);
	},
	removeSavedAttachment: (id: MailsEditorV2['id'], partName: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].savedAttachments, ['partName', partName]);
				}
			})
		);
	},
	removeUnsavedAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].unsavedAttachments = [];
				}
			})
		);
	},
	addUnsavedAttachment: (id: MailsEditorV2['id'], attachment: UnsavedAttachment): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].unsavedAttachments.push(attachment);
				}
			})
		);
	},
	addUnsavedAttachments: (id: MailsEditorV2['id'], attachments: Array<UnsavedAttachment>): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].unsavedAttachments.push(...attachments);
				}
			})
		);
	},
	addSavedAttachment: (id: MailsEditorV2['id'], attachment: SavedAttachment): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].savedAttachments.push(attachment);
				}
			})
		);
	},
	setAttachmentUploadStatus: (
		id: MailsEditorV2['id'],
		uploadId: string,
		status: AttachmentUploadProcessStatus
	): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				const unsavedAttachmentIndex = getUnsavedAttachmentIndex(state, id, uploadId);
				if (unsavedAttachmentIndex === null) {
					return;
				}

				state.editors[id].unsavedAttachments[unsavedAttachmentIndex].uploadStatus = status;
			})
		);
	},
	setAttachmentUploadCompleted: (id: MailsEditorV2['id'], uploadId: string, aid: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				const unsavedAttachmentIndex = getUnsavedAttachmentIndex(state, id, uploadId);
				if (unsavedAttachmentIndex === null) {
					return;
				}

				state.editors[id].unsavedAttachments[unsavedAttachmentIndex].aid = aid;
				state.editors[id].unsavedAttachments[unsavedAttachmentIndex].uploadStatus = {
					status: 'completed'
				};
			})
		);
	},
	removeUnsavedAttachment: (id: MailsEditorV2['id'], uploadId: string): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					remove(state.editors[id].unsavedAttachments, ['uploadId', uploadId]);
				}
			})
		);
	},
	clearStandardAttachments: (id: MailsEditorV2['id']): void => {
		set(
			produce((state: EditorsStateTypeV2) => {
				if (state?.editors?.[id]) {
					state.editors[id].savedAttachments = filterSavedInlineAttachment(
						state.editors[id].savedAttachments
					);
					state.editors[id].unsavedAttachments = filterUnsavedInlineAttachment(
						state.editors[id].unsavedAttachments
					);
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
