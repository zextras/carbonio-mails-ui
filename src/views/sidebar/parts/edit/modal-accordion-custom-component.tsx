/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Padding, Row, Icon, Container, TextWithTooltip } from '@zextras/carbonio-design-system';

import { AccordionFolder } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { indexOf, lastIndexOf, min } from 'lodash';
import { getFolderIconColor, getFolderIconName, getSystemFolderTranslatedName } from '../../utils';
import { Crumb } from '../../../../types';
import { Breadcrumbs } from './breadcrumbs';

const ModalAccordionCustomComponent: FC<{
	item: AccordionFolder;
}> = (folder) => {
	const { item } = folder;
	const [t] = useTranslation();
	const systemFolder = useMemo(() => {
		let result = '';
		if (item.folder.absFolderPath) {
			result =
				item.folder.absFolderPath.indexOf('/', 1) === -1
					? item.folder.absFolderPath.slice(1, item.folder.absFolderPath.indexOf('/', 0))
					: item.folder.absFolderPath.slice(1, item.folder.absFolderPath.indexOf('/', 1));
		}
		return result;
	}, [item.folder.absFolderPath]);
	const translatedSystemFolder = getSystemFolderTranslatedName({ t, folderName: systemFolder });
	const factor = 10;
	const path = useMemo(
		() =>
			item.folder.absFolderPath &&
			item.folder.absFolderPath
				.slice(
					item.folder.absFolderPath.indexOf('/', 1) + 1,
					item.folder.absFolderPath.lastIndexOf('/')
				)
				.split('/'),
		[item.folder.absFolderPath]
	);
	const targetFolder = useMemo(
		() => item.label || item.folder.name,
		[item.label, item.folder.name]
	);
	const targetFolderWidth = useMemo(
		() => min([targetFolder.length * factor + 18, 150]) || 0,
		[targetFolder.length]
	);
	const containerRef = useRef<HTMLDivElement>(null);
	const [availableWidth, setAvailableWidth] = useState(
		(containerRef?.current?.clientWidth || 405) - targetFolderWidth
	);
	const iconName = getFolderIconName(item);
	const iconColor = getFolderIconColor(item);

	const fullPath = useMemo(
		() => (path ? [translatedSystemFolder, ...path].join(' / ') : ''),
		[path, translatedSystemFolder]
	);

	useLayoutEffect(() => {
		const calculateAvailableWidth = (): void => {
			if (containerRef && containerRef.current) {
				setAvailableWidth(containerRef?.current?.clientWidth || 0 - targetFolderWidth);
			}
		};
		window.addEventListener('resize', calculateAvailableWidth);
		return (): void => window.removeEventListener('resize', calculateAvailableWidth);
	}, [containerRef?.current?.clientWidth, targetFolderWidth]);

	const crumbs: Array<Crumb> | undefined = useMemo(() => {
		const result = [];
		let exitLoop = false;
		let stringRemainingWidth = availableWidth;
		while (
			!(
				exitLoop !== false ||
				item.folder.parent?.absFolderPath === '/' ||
				(item.folder.parent?.isLink === true &&
					item.folder.parent?.absFolderPath.lastIndexOf('/', 1) !== -1)
			)
		) {
			const value = item.folder.absFolderPath.slice(
				lastIndexOf(item.folder.absFolderPath, '/') + 1
			);
			stringRemainingWidth -= item.folder.name.length * factor + 18;
			if (value !== '' && stringRemainingWidth > 0) {
				result.push({
					label: value,
					tooltip: ''
				});
				item.folder = item.folder.parent;
			} else {
				result.push({
					label: '...',
					tooltip: item.folder.absFolderPath.slice(indexOf(item.folder.absFolderPath, '/', 2) + 1)
				});
				exitLoop = true;
			}
		}
		if (translatedSystemFolder) {
			result.push({ label: translatedSystemFolder, tooltip: '' });
		}
		result.shift();
		return result.reverse();
	}, [availableWidth, item, translatedSystemFolder]);
	return (
		<Container
			ref={containerRef}
			width="fill"
			main-alignment="flex-start"
			orientation="vertical"
			crossAlignment="flex-start"
		>
			<Padding all="medium">
				<Row orientation="horizontal" width="fill" crossAlignment="flex-start">
					<Icon color={iconColor} icon={iconName || 'FolderOutline'} size="large" />
					<Padding right="medium" />
					{crumbs?.length > 0 && <Breadcrumbs breadcrumbs={crumbs} />}
					<Container width="fit" maxWidth={availableWidth - fullPath.length + item.label.length}>
						<TextWithTooltip overflow="ellipsis">&nbsp;{item.label}</TextWithTooltip>
					</Container>
				</Row>
			</Padding>
		</Container>
	);
};

export default ModalAccordionCustomComponent;
