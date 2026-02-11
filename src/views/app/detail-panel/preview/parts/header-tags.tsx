/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo } from 'react';

import styled from '@emotion/styled';
import {
	Button,
	Chip,
	Container,
	Dropdown,
	DropdownItem,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { Tag, useRunSearchIntegration } from '@zextras/carbonio-ui-commons';
import { map, noop } from 'lodash';
import { useTranslation } from 'react-i18next';

const BadgeButton = styled(Button)`
	padding: 0.125rem 0.5rem;
`;

const Separator = (): React.JSX.Element => (
	<Padding horizontal="extrasmall">
		<Text color="secondary" size="small">
			{','}
		</Text>
	</Padding>
);

const CompactViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	const [t] = useTranslation();

	const moreLabel = t('tooltip.view_more', {
		defaultValue_one: 'View {{count}} more item',
		defaultValue_other: 'View {{count}} more items',
		count: tags.length - 1
	});

	const handleClickComponent = useCallback(
		(e: React.SyntheticEvent<HTMLElement> | KeyboardEvent, tag: Tag) => {
			e.stopPropagation();
			triggerSearch(tag);
		},
		[triggerSearch]
	);

	const options: DropdownItem[] = useMemo(
		() => [
			...map(tags.slice(1), (tag, index) => ({
				id: `tag-${index}`,
				label: tag.name,
				onClick: (e: React.SyntheticEvent<HTMLElement> | KeyboardEvent) =>
					handleClickComponent(e, tag),
				customComponent: (
					<Chip
						key={tag.id}
						label={tag?.name}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground={tag.color}
						background="gray2"
						avatarIcon="Tag"
						onClick={(): void => triggerSearch(tag)}
					/>
				)
			}))
		],
		[handleClickComponent, tags, triggerSearch]
	);

	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			<Chip
				key={tags[0].id}
				label={tags[0].name}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore // TODO: fix type in Tag interface
				avatarBackground={tags[0].color}
				background="gray2"
				hasAvatar={false}
				avatarIcon="Tag"
				onClick={(): void => triggerSearch(tags[0])}
			/>
			{tags.length > 1 && (
				<>
					<Separator />
					<Tooltip label={moreLabel}>
						<Dropdown
							disableAutoFocus
							items={options}
							data-testid="options-dropdown"
							maxWidth="500px"
						>
							<BadgeButton
								data-testid="options-dropdown-icon"
								onClick={noop}
								size="small"
								backgroundColor="gray2"
								labelColor="text"
								label={`+${tags.length - 1}`}
								shape="round"
							/>
						</Dropdown>
					</Tooltip>
				</>
			)}
		</>
	);
};

const ExpandedViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			{map(tags, (tag, index) => (
				<>
					<Chip
						key={tag.id}
						label={tag?.name}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground={tag.color}
						background="gray2"
						hasAvatar
						avatarIcon="Tag"
						onClick={(): void => triggerSearch(tag)}
					/>
					{index !== tags.length - 1 && <Separator />}
				</>
			))}
		</>
	);
};

export const TagsInExpandedHeader = ({
	isEml,
	tags,
	open,
	isWide
}: {
	isEml?: boolean;
	tags: Tag[];
	open: boolean;
	isWide: boolean;
}): ReactElement | undefined => {
	const [t] = useTranslation();
	const tagLabel = t('label.tags', 'Tags');

	const runSearch = useRunSearchIntegration();

	const triggerSearch = useCallback(
		(tagToSearch: Tag) =>
			runSearch?.(
				[
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground: tagToSearch?.color,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${tagToSearch?.name}`,
						value: `tag:"${tagToSearch?.name}"`
					}
				],
				'mails'
			),
		[runSearch]
	);

	return !isEml && tags.length > 0 && open ? (
		<Container
			data-testid="tags-in-expanded-header"
			orientation="horizontal"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			padding={{ left: 'extralarge', bottom: 'small' }}
		>
			<Padding left="small" />
			<Text color="secondary" size="small" overflow="break-word">
				{tagLabel}:
			</Text>
			<Padding left="small" />
			{isWide ? (
				<ExpandedViewTags tags={tags} triggerSearch={triggerSearch} />
			) : (
				<CompactViewTags tags={tags} triggerSearch={triggerSearch} />
			)}
		</Container>
	) : undefined;
};
