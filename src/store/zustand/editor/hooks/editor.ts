/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { computeAndUpdateEditorStatus } from './commons';
import { useSaveDraftFromEditor } from './save-draft';
import { MailsEditorV2 } from '../../../../types';
import { useEditorsStore } from '../store';

/**
 * TODO for future refactors
 * instead of calling imperatively the computeAndUpdateEditorStatus function
 * to update the status of the store a subscription-based logic can be implemented.
 *
 * Using the subscriptionWithSelector functionality of Zustand we can subscribe
 * for changes on the store and perform the status update only when the selected
 * fields change.
 * (see https://docs.pmnd.rs/zustand/recipes/recipes#reading/writing-state-and-reacting-to-changes-outside-of-components)
 *
 * The list of the fields to take into consideration can be provide by a specific
 * function/constant so the code will be more clear and future changes/additions
 * will be easier to perform.
 */

/**
 * Returns reactive references to the subject value and to its setter
 * @param id
 */
export const useEditorSubject = (
	id: MailsEditorV2['id']
): { subject: string; setSubject: (subject: string) => void } => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].subject);
	const setter = useEditorsStore((state) => state.setSubject);

	return useMemo(
		() => ({
			subject: value,
			setSubject: (val: string): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the text values and to their setter
 * @param id
 */
export const useEditorText = (
	id: MailsEditorV2['id']
): {
	text: MailsEditorV2['text'];
	setText: (text: MailsEditorV2['text']) => void;
	resetText: () => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].text);
	const setter = useEditorsStore((state) => state.setText);
	const setText = useCallback(
		(val: MailsEditorV2['text']): void => {
			setter(id, val);
			saveDraftFromEditor(id);
		},
		[id, saveDraftFromEditor, setter]
	);

	const resetText = useCallback((): void => {
		setter(id, { plainText: '', richText: '' });
		saveDraftFromEditor(id);
	}, [id, saveDraftFromEditor, setter]);

	return useMemo(
		() => ({
			text: value,
			setText,
			resetText
		}),
		[resetText, setText, value]
	);
};

/**
 * Returns reactive references to the auto send time value and to its setter
 * @params id
 */
export const useEditorAutoSendTime = (
	id: MailsEditorV2['id']
): {
	autoSendTime: MailsEditorV2['autoSendTime'];
	setAutoSendTime: (autoSendTime: MailsEditorV2['autoSendTime']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].autoSendTime);
	const setter = useEditorsStore((state) => state.setAutoSendTime);

	return useMemo(
		() => ({
			autoSendTime: value,
			setAutoSendTime: (val: MailsEditorV2['autoSendTime']): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the draft id value and to its setter
 * @params id
 */
export const useEditorDid = (
	id: MailsEditorV2['id']
): {
	did: MailsEditorV2['did'];
	setDid: (did: MailsEditorV2['did']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].did);
	const setter = useEditorsStore((state) => state.setDid);

	return useMemo(
		() => ({
			did: value,
			setDid: (val: MailsEditorV2['did']): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the isRichText value and to its setter
 * @params id
 */
export const useEditorIsRichText = (
	id: MailsEditorV2['id']
): {
	isRichText: MailsEditorV2['isRichText'];
	setIsRichText: (isRichText: MailsEditorV2['isRichText']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].isRichText);
	const setter = useEditorsStore((state) => state.setIsRichText);

	return useMemo(
		() => ({
			isRichText: value,
			setIsRichText: (val: MailsEditorV2['isRichText']): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param editorId
 */
export const useEditorRecipients = (
	editorId: MailsEditorV2['id']
): {
	recipients: MailsEditorV2['recipients'];
	setRecipients: (recipient: MailsEditorV2['recipients']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[editorId].recipients);
	const setter = useEditorsStore((state) => state.setRecipients);

	return useMemo(
		() => ({
			recipients: value,
			setRecipients: (val: MailsEditorV2['recipients']): void => {
				setter(editorId, val);
				computeAndUpdateEditorStatus(editorId);
				saveDraftFromEditor(editorId);
			}
		}),
		[editorId, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the "to" recipients values and to their setter
 * @param editorId
 */
export const useEditorToRecipients = (
	editorId: MailsEditorV2['id']
): {
	toRecipients: MailsEditorV2['recipients']['to'];
	setToRecipients: (recipient: MailsEditorV2['recipients']['to']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[editorId].recipients.to);
	const setter = useEditorsStore((state) => state.setToRecipients);

	return useMemo(
		() => ({
			toRecipients: value,
			setToRecipients: (val: MailsEditorV2['recipients']['to']): void => {
				setter(editorId, val);
				computeAndUpdateEditorStatus(editorId);
				saveDraftFromEditor(editorId);
			}
		}),
		[editorId, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the "cc" recipients values and to their setter
 * @param editorId
 */
export const useEditorCcRecipients = (
	editorId: MailsEditorV2['id']
): {
	ccRecipients: MailsEditorV2['recipients']['cc'];
	setCcRecipients: (recipient: MailsEditorV2['recipients']['cc']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[editorId].recipients.cc);
	const setter = useEditorsStore((state) => state.setCcRecipients);

	return useMemo(
		() => ({
			ccRecipients: value,
			setCcRecipients: (val: MailsEditorV2['recipients']['cc']): void => {
				setter(editorId, val);
				computeAndUpdateEditorStatus(editorId);
				saveDraftFromEditor(editorId);
			}
		}),
		[editorId, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive references to the "bcc" recipients values and to their setter
 * @param editorId
 */
export const useEditorBccRecipients = (
	editorId: MailsEditorV2['id']
): {
	bccRecipients: MailsEditorV2['recipients']['bcc'];
	setBccRecipients: (recipient: MailsEditorV2['recipients']['bcc']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[editorId].recipients.bcc);
	const setter = useEditorsStore((state) => state.setBccRecipients);

	return useMemo(
		() => ({
			bccRecipients: value,
			setBccRecipients: (val: MailsEditorV2['recipients']['bcc']): void => {
				setter(editorId, val);
				computeAndUpdateEditorStatus(editorId);
				saveDraftFromEditor(editorId);
			}
		}),
		[editorId, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive reference to the identity id and to its setter
 * @param editorId
 */
export const useEditorIdentityId = (
	editorId: MailsEditorV2['id']
): {
	identityId: MailsEditorV2['identityId'];
	setIdentityId: (from: MailsEditorV2['identityId']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[editorId].identityId);
	const setter = useEditorsStore((state) => state.setIdentityId);

	return useMemo(
		() => ({
			identityId: value,
			setIdentityId: (val: MailsEditorV2['identityId']): void => {
				setter(editorId, val);
				computeAndUpdateEditorStatus(editorId);
				saveDraftFromEditor(editorId);
			}
		}),
		[editorId, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive reference to the isUrgent value and to its setter
 * @param id
 */
export const useEditorIsUrgent = (
	id: MailsEditorV2['id']
): {
	isUrgent: MailsEditorV2['isUrgent'];
	setIsUrgent: (isUrgent: MailsEditorV2['isUrgent']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].isUrgent);
	const setter = useEditorsStore((state) => state.setIsUrgent);

	return useMemo(
		() => ({
			isUrgent: value,
			setIsUrgent: (val: MailsEditorV2['isUrgent']): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};

/**
 * Returns reactive reference to the requestReadReceipt value and to its setter
 * @param id
 */
export const useEditorRequestReadReceipt = (
	id: MailsEditorV2['id']
): {
	requestReadReceipt: MailsEditorV2['requestReadReceipt'];
	setRequestReadReceipt: (requestReadReceipt: MailsEditorV2['requestReadReceipt']) => void;
} => {
	const saveDraftFromEditor = useSaveDraftFromEditor();
	const value = useEditorsStore((state) => state.editors[id].requestReadReceipt);
	const setter = useEditorsStore((state) => state.setRequestReadReceipt);

	return useMemo(
		() => ({
			requestReadReceipt: value,
			setRequestReadReceipt: (val: MailsEditorV2['requestReadReceipt']): void => {
				setter(id, val);
				saveDraftFromEditor(id);
			}
		}),
		[id, saveDraftFromEditor, setter, value]
	);
};
