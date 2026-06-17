/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from 'constants/index';
import { isDraft } from 'helpers/folders';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ActionFn, UIActionDescriptor } from 'types/actions';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';

export const useMsgEditDraftFn = (
	messageId: string,
	isMessageScheduled: boolean,
	folderId: string
): ActionFn => {
	const { createModal, closeModal } = useUiUtilities();

	const canExecute = useCallback((): boolean => isDraft(folderId), [folderId]);

	const execute = useCallback((): void => {
		if (canExecute()) {
			if (isMessageScheduled) {
				const warningModalId = Date.now().toString();
				createModal({
					id: warningModalId,
					title: t('label.warning', 'Warning'),
					confirmLabel: t('action.edit_anyway', 'Edit anyway'),
					onConfirm: () => {
						closeModal(warningModalId);
						createEditBoard({
							action: EditViewActions.EDIT_AS_DRAFT,
							actionTargetId: messageId
						});
					},
					onClose: () => {
						closeModal(warningModalId);
					},
					showCloseIcon: true,
					children: (
						<Text overflow="break-word">
							{t(
								'messages.edit_schedule_warning',
								'By editing this e-mail, the time and date previously set for delayed sending will be reset.'
							)}
						</Text>
					)
				});
			} else {
				createEditBoard({
					action: EditViewActions.EDIT_AS_DRAFT,
					actionTargetId: messageId
				});
			}
		}
	}, [canExecute, closeModal, createModal, isMessageScheduled, messageId]);

	return useMemo(() => ({ canExecute, execute }), [canExecute, execute]);
};

export const useMsgEditDraftDescriptor = (
	messageId: string,
	isMessageScheduled: boolean,
	folderId: string
): UIActionDescriptor => {
	const { canExecute, execute } = useMsgEditDraftFn(messageId, isMessageScheduled, folderId);
	const [t] = useTranslation();
	return {
		id: MessageActionsDescriptors.EDIT_DRAFT.id,
		icon: 'Edit2Outline',
		label: t('label.edit', 'Edit'),
		execute,
		canExecute
	};
};
