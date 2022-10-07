import React, { FC } from 'react';
import styled from 'styled-components';
import { Row, Container, Text } from '@zextras/carbonio-design-system';

const OverlayOuter = styled(Container)`
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	position: fixed;
	background: #222;
`;
const OverlayInner = styled(Container)`
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	position: absolute;
`;
const OverlayContent = styled(Container)`
	left: 50%;
	position: absolute;
	top: 50%;
	transform: translate(-50%, -50%);
`;
const OverlappingLoader: FC = () => (
	<OverlayOuter className="overlay" maxWidth="100%" maxHeight="100%">
		<OverlayInner className="overlay__inner">
			<OverlayContent className="overlay__content">
				<span className="spinner">loading..</span>
			</OverlayContent>
		</OverlayInner>
	</OverlayOuter>
);

export default OverlappingLoader;
