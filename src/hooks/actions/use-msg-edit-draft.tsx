/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { EditViewActions, MessageActionsDescriptors } from '../../constants';
import { isDraft } from '../../helpers/folders';
import { StoreProvider } from '../../store/redux';
import { ActionFn, UIActionDescriptor } from '../../types';
import { createEditBoard } from '../../views/app/detail-panel/edit/edit-view-board';
import { useUiUtilities } from '../use-ui-utilities';

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
				const id = Date.now().toString();
				createModal({
					id,
					title: t('label.warning', 'Warning'),
					confirmLabel: t('action.edit_anyway', 'Edit anyway'),
					onConfirm: () => {
						closeModal(id);
						createEditBoard({
							action: EditViewActions.EDIT_AS_DRAFT,
							actionTargetId: `${id}`
						});
					},
					onClose: () => {
						closeModal(id);
					},
					showCloseIcon: true,
					children: (
						<StoreProvider>
							<Text overflow="break-word">
								{t(
									'messages.edit_schedule_warning',
									'By editing this e-mail, the time and date previously set for delayed sending will be reset.'
								)}
							</Text>
						</StoreProvider>
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

export const useMsgEdiDraftDescriptor = (
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
