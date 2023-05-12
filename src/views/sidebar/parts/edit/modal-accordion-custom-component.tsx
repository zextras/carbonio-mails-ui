/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Icon, Padding, Row, TextWithTooltip } from '@zextras/carbonio-design-system';
import { indexOf, lastIndexOf, min } from 'lodash';
import React, { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import type { Crumb } from '../../../../types';
import { getFolderIconColor, getFolderIconName, getSystemFolderTranslatedName } from '../../utils';
import { Breadcrumbs } from './breadcrumbs';

const ModalAccordionCustomComponent: FC<{
	item: Folder;
}> = ({ item }) => {
	const systemFolder = useMemo(() => {
		let result = '';
		if (item.absFolderPath) {
			result =
				item.absFolderPath.indexOf('/', 1) === -1
					? item.absFolderPath.slice(1, item.absFolderPath.indexOf('/', 0))
					: item.absFolderPath.slice(1, item.absFolderPath.indexOf('/', 1));
		}
		return result;
	}, [item.absFolderPath]);
	const translatedSystemFolder = getSystemFolderTranslatedName({ folderName: systemFolder });
	const factor = 10;
	const path = useMemo(
		() =>
			item.absFolderPath &&
			item.absFolderPath
				.slice(item.absFolderPath.indexOf('/', 1) + 1, item.absFolderPath.lastIndexOf('/'))
				.split('/'),
		[item.absFolderPath]
	);
	const targetFolder = useMemo(() => item.name, [item.name]);
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
		const crumbItem = item;
		let exitLoop = false;
		let stringRemainingWidth = availableWidth;
		let parent = getFolder(crumbItem.parent ?? '');
		while (
			!(
				exitLoop ||
				parent?.absFolderPath === '/' ||
				(parent?.isLink === true && parent?.absFolderPath?.lastIndexOf('/', 1) !== -1)
			)
		) {
			const value = crumbItem.absFolderPath?.slice(lastIndexOf(crumbItem.absFolderPath, '/') + 1);
			stringRemainingWidth -= crumbItem.name.length * factor + 18;
			if (value && value !== '' && stringRemainingWidth > 0) {
				result.push({
					label: value,
					tooltip: ''
				});
				if (crumbItem.parent) {
					parent = getFolder(crumbItem.parent);
				}
			} else {
				result.push({
					label: '...',
					tooltip:
						crumbItem.absFolderPath?.slice(indexOf(crumbItem.absFolderPath, '/', 2) + 1) || ''
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
					{crumbs && crumbs?.length > 0 && <Breadcrumbs breadcrumbs={crumbs} />}
					<Container width="fit" maxWidth={availableWidth - fullPath.length + item.name.length}>
						<TextWithTooltip overflow="ellipsis">&nbsp;{item.name}</TextWithTooltip>
					</Container>
				</Row>
			</Padding>
		</Container>
	);
};

export default ModalAccordionCustomComponent;
