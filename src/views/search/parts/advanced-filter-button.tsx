/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Theme } from '@emotion/react';
import { Button, Container, Tooltip, useModal, useTheme } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import type { AdvancedFilterButtonProps } from 'types/index.d';
import { AdvancedFilterModal } from 'views/search/advanced-filter-modal';

function getBorderContainerStyle(theme: Theme): { borderBottom: string; borderRight: string } {
	return {
		borderBottom: `0.0625rem solid ${theme.palette.gray2.regular}`,
		borderRight: `0.0625rem solid ${theme.palette.gray2.regular}`
	};
}
export const AdvancedFilterButton = ({
	query,
	onSearchConfirm,
	isSharedFolderIncluded,
	searchDisabled,
	invalidQueryTooltip
}: AdvancedFilterButtonProps): React.JSX.Element => {
	const [t] = useTranslation();
	const theme = useTheme();
	const { createModal, closeModal } = useModal();
	const modalId = 'advanced-filter-modal';

	return (
		<Tooltip
			label={invalidQueryTooltip}
			placement="top"
			maxWidth="100%"
			disabled={!searchDisabled || !invalidQueryTooltip}
		>
			<Container
				padding={{ all: 'small' }}
				height="fit"
				mainAlignment="flex-start"
				crossAlignment="flex-start"
				borderRadius="none"
				style={getBorderContainerStyle(theme)}
			>
				<Button
					onClick={(): void => {
						createModal(
							{
								id: modalId,
								maxHeight: '90vh',
								size: 'medium',
								children: (
									<AdvancedFilterModal
										query={query}
										isSharedFolderIncluded={isSharedFolderIncluded}
										onSearchConfirm={onSearchConfirm}
										onClose={(): void => closeModal(modalId)}
									/>
								)
							},
							true
						);
					}}
					type={'outlined'}
					width="fill"
					label={t('label.single_advanced_filter', 'Advanced Filters')}
					disabled={searchDisabled}
					icon="Options2Outline"
				/>
			</Container>
		</Tooltip>
	);
};
