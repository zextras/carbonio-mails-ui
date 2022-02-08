/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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
import { Row, IconButton, Tooltip, Dropdown, ThemeContext } from '@zextras/carbonio-design-system';
import { difference, map, slice } from 'lodash';
import { useVisibleActionsCount } from '../hooks/use-visible-actions-count';

type MailMsgPreviewActionsType = {
	actions: Array<any>;
	maxActions?: number;
	maxWidth?: string;
	mainAlignment?: string;
	minWidth?: string;
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
	maxActions,
	maxWidth = '120px',
	minWidth,
	mainAlignment = 'flex-end'
}): ReactElement => {
	const actionContainerRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const theme = useContext<ThemeContextProps>(ThemeContext);

	const [visibleActionsCount, calculateVisibleActionsCount] = useVisibleActionsCount(
		actionContainerRef,
		{ numberLimit: maxActions }
	);

	const firstActions = useMemo(
		() =>
			slice(actions, 0, visibleActionsCount > 0 ? visibleActionsCount - 1 : visibleActionsCount),
		[actions, visibleActionsCount]
	);

	const secondActions = useMemo(() => difference(actions, firstActions), [actions, firstActions]);
	const iconSize = useMemo(() => parseInt(theme.sizes.icon.large, 10), [theme?.sizes?.icon?.large]);

	const onIconClick = useCallback((ev: { stopPropagation: () => void }): void => {
		ev.stopPropagation();
		setOpen((o) => !o);
	}, []);

	const onDropdownClose = useCallback((): void => {
		setOpen(false);
	}, []);

	const _maxWidth = useMemo(
		() => (iconSize && maxActions ? `${iconSize * maxActions}px` : maxWidth),
		[iconSize, maxActions, maxWidth]
	);

	const _minWidth = useMemo(
		() => minWidth ?? theme?.sizes?.icon?.large,
		[minWidth, theme?.sizes?.icon?.large]
	);

	useLayoutEffect(() => {
		calculateVisibleActionsCount();
	}, [calculateVisibleActionsCount]);

	return (
		<Row
			ref={actionContainerRef}
			mainAlignment={mainAlignment}
			maxWidth={_maxWidth}
			style={{ minWidth: _minWidth }}
			wrap="nowrap"
			takeAvailableSpace
		>
			{firstActions?.length > 0 &&
				map(firstActions, (action) => (
					<Tooltip key={`${action.icon}`} label={action.label}>
						<IconButton
							size="small"
							icon={action.icon}
							onClick={(ev: React.MouseEvent<HTMLButtonElement>): void => {
								if (ev) ev.preventDefault();
								action.click();
							}}
						/>
					</Tooltip>
				))}
			{secondActions?.length > 0 && (
				<Dropdown items={secondActions} forceOpen={open} onClose={onDropdownClose}>
					<IconButton size="small" icon="MoreVertical" onClick={onIconClick} />
				</Dropdown>
			)}
		</Row>
	);
};

export default MailMsgPreviewActions;
