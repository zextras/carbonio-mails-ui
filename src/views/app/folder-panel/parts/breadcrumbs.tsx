/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Container,
	IconCheckbox,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { noop } from 'lodash';
import { useTranslation } from 'react-i18next';

import { SortAndFilterButtonComponent } from './sort-and-filter-button-component';
import { SortAndFilterHeaderComponent } from './sort-and-filter-header-component';
import { getFolderPathForBreadcrumb } from 'helpers/folders';
import { LayoutComponent } from 'views/app/folder-panel/parts/layout-component';

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
	folderId: string;
	isSearchModule?: boolean;
}> = ({ itemsCount, isSelectModeOn, setIsSelectModeOn, folderPath, folderId, isSearchModule }) => {
	const { t } = useTranslation();

	const { folderPathFirstPart, folderPathLastPart } = useMemo(
		() => getFolderPathForBreadcrumb(folderPath),
		[folderPath]
	);

	return (
		<>
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
					wrap="nowrap"
				>
					<Row
						mainAlignment="flex-start"
						padding={{ right: 'medium' }}
						takeAvailableSpace
						wrap="nowrap"
					>
						<Tooltip
							label={t('label.activate_selection_mode', 'Activate selection mode')}
							maxWidth="100%"
						>
							<SelectIconCheckbox
								data-testid="select-icon-checkbox"
								borderRadius="regular"
								icon="CheckmarkSquare"
								defaultChecked={isSelectModeOn}
								size="regular"
								onChange={noop}
								onClick={(): void => setIsSelectModeOn((prev) => !prev)}
							/>
						</Tooltip>
						{folderPathFirstPart?.trim()?.length > 0 && (
							<Text
								size="medium"
								style={{ marginLeft: '0.5rem' }}
								data-testid="BreadcrumbPathStart"
								color="gray1"
							>
								{folderPathFirstPart}
							</Text>
						)}
						<Text size="medium" style={{ marginLeft: '0.5rem' }} data-testid="BreadcrumbPathEnd">
							{folderPathLastPart}
						</Text>
					</Row>
					<Row>
						<Text size="extrasmall" data-testid="BreadcrumbCount">
							{itemsCount}
						</Text>
						<Padding right="large" />
						{!isSearchModule && (
							<>
								<LayoutComponent />
								<SortAndFilterButtonComponent folderId={folderId} />
							</>
						)}
					</Row>
				</Row>
			</Container>
			<SortAndFilterHeaderComponent folderId={folderId} />
		</>
	);
};
