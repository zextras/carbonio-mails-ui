/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import {
	Container,
	IconCheckbox,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import styled from 'styled-components';

import { LayoutComponent } from './layout-component';
import { SortingComponent } from './sorting-component';
import { getFolderPathForBreadcrumb } from '../../../../helpers/folders';

const SelectIconCheckbox = styled(IconCheckbox)`
	svg {
		color: ${(props): string => props.theme.palette.primary.regular};
	}
`;

export const Breadcrumbs: FC<{
	itemsCount: number;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (ev: boolean | ((prevState: boolean) => boolean)) => void;
	folderPath: string;
	folderId?: string;
	isSearchModule?: boolean;
}> = ({ itemsCount, isSelectModeOn, setIsSelectModeOn, folderPath, folderId, isSearchModule }) => {
	const iconCheckboxLabel = useMemo(
		() => t('label.activate_selection_mode', 'Activate selection mode'),
		[]
	);

	const { folderPathFirstPart, folderPathLastPart } = getFolderPathForBreadcrumb(folderPath);

	return (
		<Container
			background={'gray5'}
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="3rem"
			data-testid="breadcrumbs-component"
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'extrasmall' }}
				mainAlignment="space-between"
				wrap={'nowrap'}
			>
				<Row
					mainAlignment="flex-start"
					padding={{ right: 'medium' }}
					takeAvailableSpace
					wrap={'nowrap'}
				>
					<Tooltip label={iconCheckboxLabel} maxWidth="100%">
						<SelectIconCheckbox
							data-testid="select-icon-checkbox"
							borderRadius="regular"
							icon="CheckmarkSquare"
							defaultChecked={isSelectModeOn}
							size="regular"
							onChange={(): null => null}
							onClick={(): void => {
								setIsSelectModeOn((prev: boolean) => !prev);
							}}
						/>
					</Tooltip>
					<Text
						size="medium"
						style={{ marginLeft: '0.5rem' }}
						data-testid="breadcrumb-path"
						color="gray1"
					>
						{folderPathFirstPart.concat(folderPathLastPart)}
					</Text>
				</Row>
				<Row>
					<Text size="extrasmall" data-testid="breadcrumb-count">
						{itemsCount}
					</Text>
					<Padding right="large" />
					{!isSearchModule && (
						<>
							<LayoutComponent />
							<SortingComponent folderId={folderId} />
						</>
					)}
				</Row>
			</Row>
		</Container>
	);
};
