/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import React, {
	useMemo,
	FC,
	ReactElement,
	useRef,
	useLayoutEffect,
	useState,
	useCallback,
	useContext
} from 'react';
import {
	Row,
	IconButton,
	Tooltip,
	Dropdown,
	ThemeContext,
	Padding,
	RowProps
} from '@zextras/carbonio-design-system';
import { difference, map, noop, slice } from 'lodash';
import { useParams } from 'react-router-dom';

import { useVisibleActionsCount } from '../hooks/use-visible-actions-count';

type MailMsgPreviewActionsType = {
	actions: Array<any>;
	maxActions?: number;
	maxWidth?: string;
	mainAlignment?: RowProps['mainAlignment'];
};

type ThemeContextProps = {
	sizes: {
		icon: {
			large: string;
		};
	};
};

const MailMsgPreviewActions: FC<MailMsgPreviewActionsType> = ({
	actions,
	maxWidth = '7.5rem',
	mainAlignment = 'flex-end'
}): ReactElement => {
	const { folderId }: { folderId: string } = useParams();
	const actionContainerRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const theme = useContext<ThemeContextProps>(ThemeContext);

	const maxActions = useMemo(() => {
		if (folderId === FOLDERS.TRASH) return 2;
		if (folderId === FOLDERS.DRAFTS) return 4;
		return 6;
	}, [folderId]);

	const [visibleActionsCount, calculateVisibleActionsCount] = useVisibleActionsCount(
		actionContainerRef,
		{ numberLimit: maxActions }
	);

	const firstActions = useMemo(
		() =>
			slice(
				actions,
				0,
				visibleActionsCount > 0 && actions?.length > 2
					? visibleActionsCount - 1
					: visibleActionsCount
			),
		[actions, visibleActionsCount]
	);

	const secondActions = useMemo(() => difference(actions, firstActions), [actions, firstActions]);
	const iconSize = useMemo(() => theme.sizes.icon.large, [theme.sizes.icon.large]);

	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setOpen((o) => !o);
	}, []);

	const onDropdownClose = useCallback((): void => {
		setOpen(false);
	}, []);

	const _maxWidth = useMemo(
		() => (iconSize && maxActions ? `calc(${iconSize} * ${maxActions})` : maxWidth),
		[iconSize, maxActions, maxWidth]
	);

	const _minWidth = useMemo(
		() =>
			folderId === FOLDERS.TRASH ? `calc(${iconSize} * ${maxActions})` : theme.sizes.icon.large,
		[folderId, iconSize, maxActions, theme?.sizes?.icon?.large]
	);

	useLayoutEffect(() => {
		calculateVisibleActionsCount();
	}, [calculateVisibleActionsCount]);

	return (
		<Row
			ref={actionContainerRef}
			mainAlignment={mainAlignment}
			maxWidth={_maxWidth}
			wrap="nowrap"
			style={{
				flexGrow: 1,
				flexBasis: 'fit-content',
				whiteSpace: 'nowrap',
				overflow: 'hidden',
				minWidth: _minWidth
			}}
		>
			{firstActions?.length > 0 &&
				map(firstActions, (action) =>
					action.items ? (
						<Padding right="small">
							<Tooltip label={action.label}>
								<Dropdown items={action.items}>
									<IconButton icon={action.icon} size="small" onClick={noop} />
								</Dropdown>
							</Tooltip>
						</Padding>
					) : (
						<Tooltip key={`${action.icon}`} label={action.label}>
							<IconButton
								size="small"
								icon={action.icon}
								onClick={(ev): void => {
									if (ev) ev.preventDefault();
									action.click();
								}}
							/>
						</Tooltip>
					)
				)}
			{secondActions?.length > 0 && (
				<Dropdown items={secondActions} forceOpen={open} onClose={onDropdownClose}>
					<IconButton size="small" icon="MoreVertical" onClick={onIconClick} />
				</Dropdown>
			)}
		</Row>
	);
};

export default MailMsgPreviewActions;
