/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import {
	Button,
	Container,
	Divider,
	Icon,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import type { MailMessage } from '../../types';
import { LayoutComponent } from '../../views/app/folder-panel/parts/layout-component';

type DetailPanelHeaderProps = {
	subject?: MailMessage['subject'];
	isRead?: MailMessage['read'];
	onClose?: () => void;
	layoutView?: boolean;
};
export const DetailPanelHeaderContent = ({
	subject,
	isRead,
	children,
	onClose,
	layoutView = false
}: React.PropsWithChildren<DetailPanelHeaderProps>): React.JSX.Element => {
	const [t] = useTranslation();
	const subjectLabel = useMemo(
		() => subject || t('label.no_subject_with_tags', '<No Subject>'),
		[subject, t]
	);
	return (
		<>
			<Container
				data-testid="PreviewPanelHeader"
				orientation="horizontal"
				height="3rem"
				background={'gray5'}
				mainAlignment="space-between"
				crossAlignment="center"
				padding={{ left: 'large', right: 'extrasmall' }}
				style={{ minHeight: '3rem' }}
			>
				{children}
				<Icon
					icon={isRead ? 'EmailReadOutline' : 'EmailOutline'}
					data-testid={isRead ? 'EmailReadIcon' : 'EmailUnreadIcon'}
					size={'medium'}
				/>
				<Row mainAlignment="flex-start" padding={{ left: 'large' }} takeAvailableSpace>
					<Tooltip label={subjectLabel}>
						<Text size="medium" data-testid="Subject" color={subject ? 'text' : 'secondary'}>
							{subjectLabel}
						</Text>
					</Tooltip>
				</Row>
				{layoutView && <LayoutComponent />}
				{onClose && (
					<Button
						data-testid="PreviewPanelCloseIcon"
						icon="CloseOutline"
						onClick={onClose}
						size="extralarge"
						shape="regular"
						type="default"
						labelColor="text"
						backgroundColor="transparent"
					/>
				)}
			</Container>
			<Divider />
		</>
	);
};
