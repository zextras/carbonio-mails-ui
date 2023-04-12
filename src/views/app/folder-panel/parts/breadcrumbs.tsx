/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	IconCheckbox,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { getFolderPathForBreadcrumb } from '../../../sidebar/utils';

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
}> = ({ itemsCount, isSelectModeOn, setIsSelectModeOn, folderPath }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const folderPathLastPartRef = useRef<HTMLDivElement>(null);

	const [availableWidth, setAvailableWidth] = useState('0');

	useLayoutEffect(() => {
		const calculateAvailableWidth = (): void => {
			if (containerRef && containerRef.current) {
				setAvailableWidth(
					`${
						((containerRef?.current?.offsetWidth ?? 0) -
							(folderPathLastPartRef?.current?.offsetWidth ?? 0) -
							120) /
						16
					}rem`
				);
			}
		};
		window.addEventListener('resize', calculateAvailableWidth);
		return (): void => window.removeEventListener('resize', calculateAvailableWidth);
	}, [containerRef.current?.offsetWidth]);

	useEffect(() => {
		if (containerRef?.current && folderPathLastPartRef?.current) {
			setAvailableWidth(
				`${
					((containerRef?.current?.offsetWidth ?? 0) -
						(folderPathLastPartRef?.current?.offsetWidth ?? 0) -
						120) /
					16
				}rem`
			);
		}
	}, []);

	const iconCheckboxLabel = useMemo(
		() => t('label.activate_selection_mode', 'Activate selection mode'),
		[]
	);

	const { folderPathFirstPart, folderPathLastPart } = getFolderPathForBreadcrumb(folderPath);

	return (
		<Container
			background="gray5"
			mainAlignment="flex-start"
			crossAlignment="flex-start"
			height="3rem"
			ref={containerRef}
		>
			<Row
				height="100%"
				width="fill"
				padding={{ all: 'extrasmall' }}
				mainAlignment="space-between"
				takeAvailableSpace
			>
				<Row mainAlignment="flex-start" padding={{ right: 'medium' }} takeAvailableSpace>
					<Tooltip label={iconCheckboxLabel} maxWidth="100%">
						<SelectIconCheckbox
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
					<Row maxWidth={availableWidth} mainAlignment="flex-start">
						<Text
							size="medium"
							style={{ marginLeft: '0.5rem' }}
							data-testid="BreadcrumbPath"
							color="gray1"
						>
							{folderPathFirstPart}
						</Text>
					</Row>
					<Text
						size="medium"
						style={{ marginLeft: '0.5rem' }}
						data-testid="BreadcrumbPath"
						ref={folderPathLastPartRef}
					>
						{folderPathLastPart}
					</Text>
				</Row>
				<Text size="extrasmall" data-testid="BreadcrumbCount">
					{itemsCount > 100 ? '100+' : itemsCount}
				</Text>
				<Padding right="large" />
			</Row>
		</Container>
	);
};
