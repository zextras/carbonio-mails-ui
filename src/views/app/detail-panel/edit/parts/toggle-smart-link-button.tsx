/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback } from 'react';

import { IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';

import {
	getEditor,
	useEditorAttachments,
	useEditorDraftSave
} from '../../../../../store/zustand/editor';
import { isSavedAttachment } from '../../../../../store/zustand/editor/editor-utils';
import { MailsEditorV2, SavedAttachment, UnsavedAttachment } from '../../../../../types';

export const ToggleSmartLinkButton = ({
	editorId,
	attachment
}: {
	editorId: MailsEditorV2['id'];
	attachment: UnsavedAttachment | SavedAttachment;
}): ReactElement => {
	const [_, isFilesUiAvailable] = getIntegratedFunction('select-nodes');
	const requiresSmartLinkConversion =
		isSavedAttachment(attachment) && attachment?.requiresSmartLinkConversion;

	const { toggleSmartLink } = useEditorAttachments(editorId);

	const { saveDraft } = useEditorDraftSave(editorId);

	const editor = getEditor({ id: editorId });

	const toggleSmartLinkAction = useCallback(() => {
		const draftId = editor?.did;
		if (isSavedAttachment(attachment) && draftId) {
			const { partName } = attachment;
			toggleSmartLink(partName);
			saveDraft();
		}
	}, [attachment, editor?.did, saveDraft, toggleSmartLink]);

	return isFilesUiAvailable && isSavedAttachment(attachment) ? (
		<Tooltip
			label={
				requiresSmartLinkConversion
					? t('label.convert_back_to_attachment', 'Convert back to attachment')
					: t('label.convert_to_smart_link', 'Convert to smart link')
			}
		>
			<IconButton
				size="medium"
				icon={requiresSmartLinkConversion ? 'Refresh' : 'Link2Outline'}
				onClick={toggleSmartLinkAction}
				style={requiresSmartLinkConversion ? { transform: 'scale(-1, 1)' } : {}}
			/>
		</Tooltip>
	) : (
		<></>
	);
};
