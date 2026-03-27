/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import styled from '@emotion/styled';
import { Button, Container, useModal } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { AdvancedFilterButtonProps } from 'types/search';
import { AdvancedFilterModal } from 'views/search/advanced-filter-modal';

const BorderContainer = styled(Container)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
	border-right: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
`;

export const AdvancedFilterButton = ({
	query,
	onSearchConfirm,
	isSharedFolderIncluded
}: AdvancedFilterButtonProps): React.JSX.Element => {
	const [t] = useTranslation();
	const { createModal, closeModal } = useModal();
	const modalId = 'advanced-filter-modal';

	return (
		<BorderContainer
			padding={{ all: 'small' }}
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			borderRadius="none"
		>
			<Button
				onClick={(): void => {
					createModal(
						{
							id: modalId,
							maxHeight: '90vh',
							size: 'medium',
							onClose: (): void => {
								closeModal(modalId);
							},
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
				icon="Options2Outline"
			/>
		</BorderContainer>
	);
};
