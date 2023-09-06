/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserSettings } from '@zextras/carbonio-shell-ui';
import { findIndex } from 'lodash';

import { TIMEOUTS } from '../../../constants';
import { EditorsStateTypeV2, UnsavedAttachment } from '../../../types';

export const getUnsavedAttachmentIndex = (
	state: EditorsStateTypeV2,
	editorId: string,
	uploadId: string
): number | null => {
	if (!state?.editors?.[editorId]) {
		return null;
	}
	const unsavedAttachmentIndex = findIndex(state.editors[editorId].unsavedAttachments, [
		'uploadId',
		uploadId
	]);
	return unsavedAttachmentIndex < 0 ? null : unsavedAttachmentIndex;
};

export const getUnsavedAttachment = (
	state: EditorsStateTypeV2,
	editorId: string,
	uploadId: string
): UnsavedAttachment | null => {
	const index = getUnsavedAttachmentIndex(state, editorId, uploadId);
	if (index === null) {
		return null;
	}
	return state.editors[editorId].unsavedAttachments[index];
};

export function getDraftSaveDelay(): number {
	const maximumDraftSaveDelay = TIMEOUTS.DRAFT_SAVE_DELAY;
	const autoSaveDraftSettings = getUserSettings().prefs.zimbraPrefAutoSaveDraftInterval as string;
	if (!autoSaveDraftSettings || autoSaveDraftSettings === '0') {
		return TIMEOUTS.DRAFT_SAVE_DELAY;
	}
	if (autoSaveDraftSettings.includes('s')) {
		autoSaveDraftSettings.replace('s', '');
		return Math.min(parseInt(autoSaveDraftSettings, 10) * 1000, maximumDraftSaveDelay);
	}
	if (autoSaveDraftSettings.includes('m')) {
		autoSaveDraftSettings.replace('m', '');
		return Math.min(parseInt(autoSaveDraftSettings, 10) * 1000 * 60, maximumDraftSaveDelay);
	}
	return TIMEOUTS.DRAFT_SAVE_DELAY;
}
