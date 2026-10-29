/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, isEmpty } from 'lodash';

import { getCreatedSignatureId, signatureRequest } from 'api/get-signatures-soap-api';
import { SignItemType } from 'types/settings';
import { saveSettings } from 'views/settings/save-settings';

type SignaturePref = 'zimbraPrefDefaultSignatureId' | 'zimbraPrefForwardReplySignatureId';

type SaveSignaturesParams = {
	itemsAdd: Array<SignItemType>;
	// passed as they are to signatureRequest
	itemsEdit: unknown;
	itemsDelete: unknown;
	account: { name: string };
	// prefs pointing to signatures created in this save, by their temporary id
	pendingPrefs: Partial<Record<SignaturePref, string>>;
};

/**
 * Saves the signatures, then the prefs that point to the ones just created: their real id is known only
 * after the creation. Rejects only when the signatures can't be saved: once they exist, the caller must reload
 * them even if the prefs fail.
 * @returns what happened to the prefs
 */
export const saveSignatures = async ({
	itemsAdd,
	itemsEdit,
	itemsDelete,
	account,
	pendingPrefs
}: SaveSignaturesParams): Promise<'none' | 'saved' | 'failed'> => {
	const { response } = await signatureRequest({ itemsAdd, itemsEdit, itemsDelete, account });
	const prefs = Object.entries(pendingPrefs).reduce<Partial<Record<SignaturePref, string>>>(
		(acc, [pref, temporaryId]) => {
			const created = find(itemsAdd, { id: temporaryId });
			const realId = created && getCreatedSignatureId(response, created.label);
			return realId ? { ...acc, [pref]: realId } : acc;
		},
		{}
	);
	if (isEmpty(prefs)) {
		return 'none';
	}
	return saveSettings({ prefs }).then(
		() => 'saved' as const,
		() => 'failed' as const
	);
};
