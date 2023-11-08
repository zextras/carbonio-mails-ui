/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { CreateModalFn } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { ApplyFilterModal } from './modals/apply-filter-modal';
import { FilterActionsDescriptors } from '../constants';
import { UIAction } from '../types';

export type ApplyFilterUIActionExecutionParams = {
	criteria: {
		filterName: string;
	};
	uiUtilities: {
		createModal: CreateModalFn;
	};
};

export const getApplyFilterUIAction = (): UIAction<ApplyFilterUIActionExecutionParams> => ({
	id: FilterActionsDescriptors.APPLY.id,
	icon: 'QuestionMarkOutline',
	label: t('action.apply_filter_on_folder', 'Apply filter on folder'),
	execute: ({ criteria, uiUtilities }: ApplyFilterUIActionExecutionParams): void => {
		const closeModal = uiUtilities.createModal({
			title: t('modals.apply_filters.title', {
				filterName: criteria.filterName,
				defaultValue: 'Application filter {{filterName}}'
			}),
			onClose: () => closeModal(),
			confirmLabel: t('modals.apply_filters.button_apply', 'Apply'),
			onConfirm: (): void => {
				console.log('*** Confirmed');
				closeModal();
			},
			secondaryActionLabel: t('label.cancel', 'Cancel'),
			onSecondaryAction: () => closeModal(),
			size: 'medium',
			children: <ApplyFilterModal filterName={criteria.filterName}></ApplyFilterModal>
		});
		// applyFilterRules({
		// 	ruleName: 'test',
		// 	foldersId: ['2'],
		// 	messagesId: ['28125', '28121']
		// })
		// 	.then((x) => console.log('**** x', x))
		// 	.catch((err) => console.error('***** err', err));
	}
});
