/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Button, Container, Tooltip } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { t } from '@zextras/carbonio-shell-ui';
import { AdvancedFilterButtonProps } from '../../../types';

const BorderContainer = styled(Container)`
	border-bottom: 1px solid ${({ theme }): string => theme?.palette?.gray2?.regular};
	border-right: 1px solid ${({ theme }): string => theme?.palette?.gray2?.regular};
`;

export const AdvancedFilterButton: FC<AdvancedFilterButtonProps> = ({
	setShowAdvanceFilters,
	searchDisabled,
	filterCount,
	invalidQueryTooltip
}) => (
	<Tooltip
		label={invalidQueryTooltip}
		placement="top"
		maxWidth="100%"
		disabled={!searchDisabled || !invalidQueryTooltip}
	>
		<BorderContainer
			padding={{ all: 'small' }}
			height="fit"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			borderRadius="none"
		>
			<Button
				onClick={(): void => setShowAdvanceFilters(true)}
				type={filterCount > 0 ? 'default' : 'outlined'}
				width="fill"
				label={
					filterCount === 0
						? t('label.single_advanced_filter', 'Advanced Filters')
						: t('label.advanced_filters', {
								count: filterCount,
								defaultValue: '{{count}} Advanced Filter',
								defaultValue_plural: '{{count}} Advanced Filters'
						  })
				}
				disabled={searchDisabled}
				icon="Options2Outline"
			/>
		</BorderContainer>
	</Tooltip>
);
