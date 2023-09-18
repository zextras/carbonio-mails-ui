/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { computeAndUpdateEditorStatus } from './commons';
import { debouncedSaveDraftFromEditor } from './save-draft';
import { EditViewActionsType, MailsEditorV2 } from '../../../../types';
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
 * Returns reactive references to the action value and to its setter
 * @param id
 */
export const useEditorAction = (
	id: MailsEditorV2['id']
): { action: string; setAction: (action: EditViewActionsType) => void } => {
	const value = useEditorsStore((state) => state.editors[id].action);
	const setter = useEditorsStore((state) => state.updateAction);

	return {
		action: value,
		setAction: (val: EditViewActionsType): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
};

/**
 * Returns reactive references to the subject value and to its setter
 * @param id
 */
export const useEditorSubject = (
	id: MailsEditorV2['id']
): { subject: string; setSubject: (subject: string) => void } => {
	const value = useEditorsStore((state) => state.editors[id].subject);
	const setter = useEditorsStore((state) => state.updateSubject);

	return {
		subject: value,
		setSubject: (val: string): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[id].text);
	const setter = useEditorsStore((state) => state.updateText);
	const setText = useCallback(
		(val: MailsEditorV2['text']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		},
		[id, setter]
	);

	const resetText = useCallback((): void => {
		setter(id, { plainText: '', richText: '' });
		debouncedSaveDraftFromEditor(id);
	}, [id, setter]);

	return {
		text: value,
		setText,
		resetText
	};
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
	const value = useEditorsStore((state) => state.editors[id].autoSendTime);
	const setter = useEditorsStore((state) => state.updateAutoSendTime);

	return {
		autoSendTime: value,
		setAutoSendTime: (val: MailsEditorV2['autoSendTime']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[id].did);
	const setter = useEditorsStore((state) => state.setDid);

	return {
		did: value,
		setDid: (val: MailsEditorV2['did']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[id].isRichText);
	const setter = useEditorsStore((state) => state.setIsRichText);

	return {
		isRichText: value,
		setIsRichText: (val: MailsEditorV2['isRichText']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
};

/**
 * Returns reactive references to the signature value and to its setter
 * @params id
 */
export const useEditorSignature = (
	id: MailsEditorV2['id']
): {
	signature: MailsEditorV2['signature'];
	setSignature: (signature: MailsEditorV2['signature']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].signature);
	const setter = useEditorsStore((state) => state.setSignature);

	return {
		signature: value,
		setSignature: (val: MailsEditorV2['signature']) => setter(id, val)
	};
};

/**
 * Returns reactive references to the originalId value and to its setter
 * @params id
 */
export const useEditorOriginalId = (
	id: MailsEditorV2['id']
): {
	originalId: MailsEditorV2['originalId'];
	setOriginalId: (originalId: MailsEditorV2['originalId']) => void;
} => {
	const value = useEditorsStore((state) => state.editors[id].originalId);
	const setter = useEditorsStore((state) => state.setOriginalId);

	return {
		originalId: value,
		setOriginalId: (val: MailsEditorV2['originalId']) => setter(id, val)
	};
};

/**
 * set the originalMessage of a specific editor.
 * @params id
 * @params originalMessage
 */
export const useSetOriginalMessage = ({
	editorId,
	originalMessage
}: {
	editorId: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore((s) => s.setOriginalMessage(editorId, originalMessage));

export const getSetOriginalMessage = ({
	id,
	originalMessage
}: {
	id: MailsEditorV2['id'];
	originalMessage: MailsEditorV2['originalMessage'];
}): void => useEditorsStore.getState().setOriginalMessage(id, originalMessage);

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
	const value = useEditorsStore((state) => state.editors[editorId].recipients);
	const setter = useEditorsStore((state) => state.updateRecipients);

	return {
		recipients: value,
		setRecipients: (val: MailsEditorV2['recipients']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[editorId].recipients.to);
	const setter = useEditorsStore((state) => state.updateToRecipients);

	return {
		toRecipients: value,
		setToRecipients: (val: MailsEditorV2['recipients']['to']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[editorId].recipients.cc);
	const setter = useEditorsStore((state) => state.updateCcRecipients);

	return {
		ccRecipients: value,
		setCcRecipients: (val: MailsEditorV2['recipients']['cc']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[editorId].recipients.bcc);
	const setter = useEditorsStore((state) => state.updateBccRecipients);

	return {
		bccRecipients: value,
		setBccRecipients: (val: MailsEditorV2['recipients']['bcc']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[editorId].identityId);
	const setter = useEditorsStore((state) => state.updateIdentityId);

	return {
		identityId: value,
		setIdentityId: (val: MailsEditorV2['identityId']): void => {
			setter(editorId, val);
			computeAndUpdateEditorStatus(editorId);
			debouncedSaveDraftFromEditor(editorId);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[id].isUrgent);
	const setter = useEditorsStore((state) => state.updateIsUrgent);

	return {
		isUrgent: value,
		setIsUrgent: (val: MailsEditorV2['isUrgent']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
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
	const value = useEditorsStore((state) => state.editors[id].requestReadReceipt);
	const setter = useEditorsStore((state) => state.updateRequestReadReceipt);

	return {
		requestReadReceipt: value,
		setRequestReadReceipt: (val: MailsEditorV2['requestReadReceipt']): void => {
			setter(id, val);
			debouncedSaveDraftFromEditor(id);
		}
	};
};
