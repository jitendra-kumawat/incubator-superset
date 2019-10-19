/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Gallery from 'react-grid-gallery';
import ReactPaginate from 'react-paginate';
import './GridGallery.css';

const propTypes = {
  height: PropTypes.number,
  width: PropTypes.number,
  data: PropTypes.arrayOf(PropTypes.object),
  allColumnsY: PropTypes.string,
  allColumnsX: PropTypes.string,
  allColumns: PropTypes.arrayOf(PropTypes.string),
  pageLength:PropTypes.number,
};
const defaultProps = {
  height: undefined,
  width: undefined,
  data: undefined,
  allColumnsY: undefined,
  allColumnsX: undefined,
  allColumns: [],
  pageLength:25,
};

const captionStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  maxHeight: '240px',
  overflow: 'hidden',
  position: 'absolute',
  bottom: '0',
  width: '100%',
  color: 'white',
  padding: '2px',
  fontSize: '90%',
};

const customTagStyle = {
  wordWrap: 'break-word',
  display: 'grid',
  backgroundColor: 'white',
  height: 'auto',
  fontSize: '75%',
  fontWeight: '600',
  lineHeight: '1',
  padding: '.2em .6em .3em',
  borderRadius: '.25em',
  color: 'black',
  verticalAlign: 'baseline',
  margin: '2px',
};

const style = { overflow: 'auto', height: '100%', width: '100%', display: 'inline-table' };
const pageDivStyle = { width: '100%', display: 'table-footer-group' };

class GridGallery extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      offset: 0,
    };
  }

  setCustomTags(i) {
    return (
      i.tags.map((t) => {
        return ( <div
          key={t.value}
          style={customTagStyle}>
          {t.title}:{t.value}
        </div>
      )}
    ))
  }

  handlePageClick (data) {
    let selected = data.selected;
    this.setState(() => ({ offset: selected }));
  };

  getTags(data){
    var tags = []
    this.props.allColumns.forEach(col => {
      tags.push({ 'title': col, 'value': data[col] })
    });
    return tags;
  };

  getGridData(offset){
    var dp = [];
    var start  = offset * this.props.pageLength;
    for (let index = start; index < start + this.props.pageLength; index++) {
      const element = this.props.data[index];
      dp.push(
        {
          src: element[this.props.allColumnsX],
          thumbnail: element[this.props.allColumnsX],
          isSelected: false,
          tags: this.getTags(element),
          thumbnailCaption: element[this.props.allColumnsY],
        }
      );
    };

    return dp;
  }

  getImageData(offset){
    let images =  this.getGridData(offset)
    images.map((i) => {
      i.customOverlay = (
        <div style={captionStyle}>
          <div>{i.thumbnailCaption}</div>
          {i.hasOwnProperty('tags') &&
            this.setCustomTags(i)}
        </div>);
      return i;
    });

    return images;

  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.offset != this.state.offset) {
      return true;
    }
    return false;
  }
  
  render() {
    const pageCount = Math.ceil(this.props.data.length / this.props.pageLength);
    let images = this.getImageData(this.state.offset);
    return (
      <div style={style} >
        <div>
        <Gallery images={images} enableImageSelection={false} />
        </div>
        <div style={pageDivStyle}>
        <ReactPaginate
          previousLabel={'previous'}
          nextLabel={'next'}
          breakLabel={'...'}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={this.handlePageClick.bind(this)}
          containerClassName={'pagination'}
          subContainerClassName={'pages pagination'}
          activeClassName={'active'}
          breakClassName={'break-me'}
        />
        </div>
      </div>
    );
  }
}

GridGallery.propTypes = propTypes;
GridGallery.defaultProps = defaultProps;

export default GridGallery;
