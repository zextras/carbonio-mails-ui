/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { Button, Container, Divider } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type ReadingPaneHeaderBlockProps = {
	/** The subject line: what comes before the close button. Its subject has `data-testid="Subject"`. */
	row: ReactNode;
	/** Without it, no close button. */
	onClose?: () => void;
	/** Under the subject line, starting where the subject starts: the tags. */
	children?: ReactNode;
};

/**
 * The grey block at the top of the reading pane: the subject line, then what it is given under the
 * subject, then the divider. Before the subject there may be the navigation and the icon: where the
 * subject starts is measured, not assumed.
 */
export const ReadingPaneHeaderBlock = ({
	row,
	onClose,
	children
}: Readonly<ReadingPaneHeaderBlockProps>): React.JSX.Element => {
	const [t] = useTranslation();
	const blockRef = useRef<HTMLDivElement>(null);
	const [subjectStart, setSubjectStart] = useState(0);

	const hasChildren = children !== undefined && children !== null && children !== false;

	// The subject's column changes size when what comes before it changes (the navigation of a layout,
	// the font size): measure then, not at every render.
	useLayoutEffect(() => {
		const block = blockRef.current;
		const subject = block?.querySelector('[data-testid="Subject"]');
		if (!hasChildren || !block || !subject) {
			return undefined;
		}
		const measure = (): void =>
			setSubjectStart(
				Math.round(subject.getBoundingClientRect().left - block.getBoundingClientRect().left)
			);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(block);
		if (subject.parentElement) {
			observer.observe(subject.parentElement);
		}
		return (): void => observer.disconnect();
	}, [hasChildren]);

	return (
		<>
			<Container ref={blockRef} data-testid="PreviewPanelHeader" height="fit" background={'gray5'}>
				<Container
					orientation="horizontal"
					height="3rem"
					background={'gray5'}
					mainAlignment="space-between"
					crossAlignment="center"
					padding={{ left: 'large', right: 'extrasmall' }}
					style={{ minHeight: '3rem' }}
				>
					{row}
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
							aria-label={t('label.close', 'Close')}
						/>
					)}
				</Container>
				{hasChildren && (
					<div
						data-testid="reading-pane-header-below-subject"
						style={{ boxSizing: 'border-box', width: '100%', paddingLeft: `${subjectStart}px` }}
					>
						{children}
					</div>
				)}
			</Container>
			<Divider />
		</>
	);
};
