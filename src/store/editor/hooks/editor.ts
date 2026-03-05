/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback, useMemo } from 'react';

import { useSaveDraftFromEditor } from 'store/editor/hooks/save-draft';
import { computeAndUpdateEditorStatus, useEditorSetDirty } from 'store/editor/hooks/statuses';
import { useEditorsStore } from 'store/editor/store';
import { MailsEditorV2 } from 'types/editor';

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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].subject);
	const setter = useEditorsStore.getState().setSubject;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			subject: value,
			setSubject: (val: string): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
	);
};

export const useEditorTextProvider = (
	id: MailsEditorV2['id']
): {
	textProvider: MailsEditorV2['textProvider'];
	setTextProvider: (textProvider: MailsEditorV2['textProvider']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].textProvider);
	const setter = useEditorsStore.getState().setTextProvider;

	const setTextProvider = useCallback(
		(val: MailsEditorV2['textProvider']): void => {
			if (val !== undefined) {
				setter(id, val);
			}
		},
		[id, setter]
	);

	return useMemo(
		() => ({
			textProvider: value,
			setTextProvider
		}),
		[setTextProvider, value]
	);
};

type EditorSetTextOptions = {
	syncTextProvider?: boolean;
};

/**
 * Returns reactive references to the text values and to their setter
 * @param id
 */
export const useEditorText = (
	id: MailsEditorV2['id']
): {
	getText: () => MailsEditorV2['text'];
	setText: (text: MailsEditorV2['text'], options?: EditorSetTextOptions) => void;
} => {
	const { immediateSaveDraft } = useSaveDraftFromEditor(id);
	const setter = useEditorsStore.getState().setText;
	const { textProvider } = useEditorTextProvider(id);
	const { setDirty } = useEditorSetDirty(id);

	const getText = useCallback(
		(): MailsEditorV2['text'] =>
			textProvider?.getCurrentText() ?? useEditorsStore.getState().editors[id].text,
		[id, textProvider]
	);

	const setText = useCallback(
		(
			val: MailsEditorV2['text'],
			options: EditorSetTextOptions = { syncTextProvider: true }
		): void => {
			if (textProvider && options.syncTextProvider) {
				textProvider.setCurrentText(val);
			}
			setter(id, val);
			setDirty();
			immediateSaveDraft();
		},
		[id, immediateSaveDraft, setter, textProvider, setDirty]
	);

	return useMemo(
		() => ({
			getText,
			setText
		}),
		[getText, setText]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].autoSendTime);
	const setter = useEditorsStore.getState().setAutoSendTime;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			autoSendTime: value,
			setAutoSendTime: (val: MailsEditorV2['autoSendTime']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].did);
	const setter = useEditorsStore.getState().setDid;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			did: value,
			setDid: (val: MailsEditorV2['did']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].isRichText);
	const setter = useEditorsStore.getState().setIsRichText;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			isRichText: value,
			setIsRichText: (val: MailsEditorV2['isRichText']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].recipients);
	const setter = useEditorsStore.getState().setRecipients;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			recipients: value,
			setRecipients: (val: MailsEditorV2['recipients']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].recipients.to);
	const setter = useEditorsStore.getState().setToRecipients;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			toRecipients: value,
			setToRecipients: (val: MailsEditorV2['recipients']['to']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].recipients.cc);
	const setter = useEditorsStore.getState().setCcRecipients;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			ccRecipients: value,
			setCcRecipients: (val: MailsEditorV2['recipients']['cc']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].recipients.bcc);
	const setter = useEditorsStore.getState().setBccRecipients;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			bccRecipients: value,
			setBccRecipients: (val: MailsEditorV2['recipients']['bcc']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].identityId);
	const setter = useEditorsStore.getState().setIdentityId;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			identityId: value,
			setIdentityId: (val: MailsEditorV2['identityId']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].isUrgent);
	const setter = useEditorsStore.getState().setIsUrgent;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			isUrgent: value,
			setIsUrgent: (val: MailsEditorV2['isUrgent']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
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
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].requestReadReceipt);
	const setter = useEditorsStore.getState().setRequestReadReceipt;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			requestReadReceipt: value,
			setRequestReadReceipt: (val: MailsEditorV2['requestReadReceipt']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
	);
};

/**
 * Returns reactive reference to the signature id and to its setter
 * @param editorId
 */
export const useEditorSignatureId = (
	editorId: MailsEditorV2['id']
): {
	signatureId: MailsEditorV2['signatureId'];
	setSignatureId: (from: MailsEditorV2['signatureId']) => void;
} => {
	const { debouncedSaveDraft } = useSaveDraftFromEditor(editorId);
	const value = useEditorsStore((state) => state.editors[editorId].signatureId);
	const setter = useEditorsStore.getState().setSignatureId;
	const { setDirty } = useEditorSetDirty(editorId);

	return useMemo(
		() => ({
			signatureId: value,
			setSignatureId: (val: MailsEditorV2['signatureId']): void => {
				setter(editorId, val);
				setDirty();
				computeAndUpdateEditorStatus(editorId);
				debouncedSaveDraft();
			}
		}),
		[editorId, debouncedSaveDraft, setter, value, setDirty]
	);
};

/**
 * Returns reactive reference to the isUrgent value and to its setter
 * @param id
 */
export const useEditorIsSmimeSign = (
	id: MailsEditorV2['id']
): {
	isSmimeSign: MailsEditorV2['isSmimeSign'];
	setIsSmimeSign: (isSmimeSign: MailsEditorV2['isSmimeSign']) => void;
} => {
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].isSmimeSign);
	const setter = useEditorsStore.getState().setIsSmimeSign;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			isSmimeSign: value,
			setIsSmimeSign: (val: MailsEditorV2['isSmimeSign']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
	);
};

/**
 * Returns reactive reference to the isUrgent value and to its setter
 * @param id
 */
export const useEditorIsSmimeEncrypt = (
	id: MailsEditorV2['id']
): {
	isSmimeEncrypt: MailsEditorV2['isSmimeEncrypt'];
	setIsSmimeEncrypt: (isSmimeEncrypt: MailsEditorV2['isSmimeEncrypt']) => void;
} => {
	const { debouncedSaveDraft } = useSaveDraftFromEditor(id);
	const value = useEditorsStore((state) => state.editors[id].isSmimeEncrypt);
	const setter = useEditorsStore.getState().setIsSmimeEncrypt;
	const { setDirty } = useEditorSetDirty(id);

	return useMemo(
		() => ({
			isSmimeEncrypt: value,
			setIsSmimeEncrypt: (val: MailsEditorV2['isSmimeEncrypt']): void => {
				setter(id, val);
				setDirty();
				debouncedSaveDraft();
			}
		}),
		[id, debouncedSaveDraft, setter, value, setDirty]
	);
};
