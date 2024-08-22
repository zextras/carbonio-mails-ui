/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { CloseModalFn, CreateModalFn, ModalManager } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { ApplyFilterModal } from './modals/apply-filter-modal';
import { FilterActionsDescriptors } from '../constants';
import { UIAction } from '../types';

export type ApplyFilterUIActionExecutionParams = {
	criteria: {
		filterName: string;
	};
	uiUtilities: {
		closeModal: CloseModalFn;
		createModal: CreateModalFn;
	};
};

export const getApplyFilterUIAction = (): UIAction<ApplyFilterUIActionExecutionParams> => ({
	id: FilterActionsDescriptors.APPLY.id,
	icon: 'QuestionMarkOutline',
	label: t('action.apply_filter_on_folder', 'Apply filter on folder'),
	openModal: ({ criteria, uiUtilities }: ApplyFilterUIActionExecutionParams): void => {
		const id = Date.now().toString();
		uiUtilities.createModal(
			{
				id,
				size: 'medium',
				children: (
					<ModalManager>
						<ApplyFilterModal criteria={criteria} modalId={id}></ApplyFilterModal>
					</ModalManager>
				)
			},
			true
		);
	}
});
