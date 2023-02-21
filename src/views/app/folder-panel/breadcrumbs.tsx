/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	Divider,
	Row,
	Text,
	Padding,
	IconCheckbox
} from '@zextras/carbonio-design-system';
import { FOLDERS, t } from '@zextras/carbonio-shell-ui';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';

const SelectIconCheckbox = styled(IconCheckbox)`
	svg {
		color: ${(props): string => props.theme.palette.gray0.disabled};
	}
`;

export const Breadcrumbs: FC<{
	folderPath: string;
	itemsCount: number;
	folderId: string | number;
	isSelectModeOn: boolean;
	setIsSelectModeOn: (ev: boolean) => void;
}> = ({ folderPath, itemsCount, folderId, isSelectModeOn, setIsSelectModeOn }) => {
	const folderTitle = useMemo(
		() =>
			folderId === FOLDERS.SPAM
				? `/ ${t('label.spam', 'Spam')}`
				: folderPath?.split('/')?.join(' / '),
		[folderId, folderPath]
	);
	return (
		<Container
			background="gray5"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="3rem"
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'extrasmall' }}
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row mainAlignment="flex-start" takeAvailableSpace padding={{ right: 'medium' }}>
					<SelectIconCheckbox
						borderRadius="regular"
						icon="CheckmarkSquare"
						defaultChecked={isSelectModeOn}
						size="regular"
						onChange={(): null => null}
						onClick={(): void => {
							setIsSelectModeOn(!isSelectModeOn);
						}}
					/>
					<Text
						size="medium"
						color="secondary"
						style={{ marginLeft: '0.5rem' }}
						data-testid="BreadcrumbPath"
					>
						{t('label.path', 'Path')}
					</Text>
					<Text size="medium" style={{ marginLeft: '0.25rem' }} data-testid="BreadcrumbFolderPath">
						{folderTitle}
					</Text>
				</Row>
				<Text size="extrasmall" data-testid="BreadcrumbCount">
					{itemsCount > 100 ? '100+' : itemsCount}
				</Text>
				<Padding right="large" />
			</Row>
			<Divider />
		</Container>
	);
};
