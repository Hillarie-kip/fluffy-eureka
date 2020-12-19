import React, {
  useState, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';

import {
  Row, Col, UncontrolledAlert,
  TabContent, TabPane, Nav, NavItem, NavLink,
} from 'reactstrap';
import classnames from 'classnames';
import TabStyle from '../assets/css/StyledComponents/TabStyled';
import { searchSymptom } from '../api/api';
import ClinMetadataTable from '../components/Tables/ClinMetadataTable';
import SearchBySymptom from '../components/Queries/KatsuSymptoms';

import {
  ProcessData, diseaseSchema,
  featureSchema, ProcessPhenopackets,
  ProcessFeatures,
} from '../components/Processing/ChordSchemas';
import { notify, NotificationAlert } from '../utils/alert';

import LoadingIndicator, {
  trackPromise,
  usePromiseTracker,
} from '../components/LoadingIndicator/LoadingIndicator';
import {mergeFederatedResults} from '../utils/utils'

function CreateColumns(columnNames, cb) {
  const columnList = [];

  Object.values(columnNames).forEach((name) => {
    const column = {
      Header: (name.charAt(0).toLocaleUpperCase() + name.slice(1)),
      accessor: name,
      filter: 'fuzzyText',
      aggregate: 'count',
      Aggregated: ({ value }) => `${value} `,
    };
    columnList.push(column);
  });
  cb(columnList);
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function TableApp({ updateState }) {
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [data, setData] = useState([]);
  const [phenopackets, setPhenopackets] = useState({});
  const [columns, setColumns] = useState([]);
  const [diseases, setDiseases] = useState({});
  const [symptomsTable, setSymptomsTable] = useState({});
  const [complicationsTable, setComplicationsTable] = useState({});

  const [activeID, setActiveID] = useState('');
  const [diseaseTableData, setDiseaseTableData] = useState([]);
  const [diseaseTableColumns, setDiseaseTableColumns] = useState([]);
  const [symptomsTableData, setSymptomsTableData] = useState([]);
  const [symptomsTableColumns, setSymptomsTableColumns] = useState([]);
  const [complicationsTableData, setComplicationsTableData] = useState([]);
  const [complicationsTableColumns, setComplicationsTableColumns] = useState([]);

  const { promiseInProgress } = usePromiseTracker();
  const [activeTab, setActiveTab] = useState('1');

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const notifyEl = useRef(null);

  const clearSubTables = () => {
    setDiseaseTableData([]);
    setSymptomsTableData([]);
    setComplicationsTableData([]);
  };

  useEffect(() => {
    updateState({ datasetVisible: false });
  }, [updateState])



  useEffect(() => {
    // fetch data

    try {
      trackPromise(
        searchSymptom(selectedSymptom)
          .then((dataResponse) => {
            const merged = mergeFederatedResults(dataResponse)
            const [tdatasets, tphenopackets] = ProcessPhenopackets(merged);
            setData(tdatasets);
            setPhenopackets(tphenopackets);
            setActiveID('');
            clearSubTables();
          })
          .catch(() => {
            notify(
              notifyEl,
              'The resources you requested were not available.',
              'warning',
            );
            setData([]);
            setPhenopackets([]);
            setActiveID('');
            clearSubTables();
          }),
      );
    } catch (err) {
      // Need better reporting

    }
  }, [selectedSymptom]);

  useEffect(() => {
    // Separate Effect since state change is async and columns depends on data
    // Not entirely sure if necessary
    try {
      CreateColumns(Object.keys(data[0]), setColumns);
    } catch (err) {
      // Need better reporting

    }
  }, [data]);

  useEffect(() => {
    try {
      if (activeID) {
        if (diseases[activeID]) {
          setDiseaseTableData(diseases[activeID]);
        } else {
          const newDisease = ProcessData(activeID, phenopackets[activeID].diseases, diseaseSchema);
          if (!isEmpty(diseases)) {
            setDiseases((prevState) => ({
              ...prevState, ...newDisease,
            }));
            setDiseaseTableData(diseases[activeID]);
          } else {
            setDiseases(newDisease);
            setDiseaseTableData(diseases[activeID]);
          }
        }
      }
    } catch (err) {
      // Need better reporting
    }
  }, [activeID, diseases, phenopackets]);

  useEffect(() => {
    try {
      CreateColumns(Object.keys(diseaseTableData[0]), setDiseaseTableColumns);
    } catch (err) {
      // Need better reporting
    }
  }, [diseaseTableData]);

  useEffect(() => {
    // Want to store previously created tables rather than reprocessing them
    // each time the same sub tables are needed
    try {
      if (activeID) {
        if (symptomsTable[activeID]) {
          // The sub tables have already been created once, so set them back
          setSymptomsTableData(symptomsTable[activeID]);
        } else {
          const newFeature = ProcessFeatures(activeID, phenopackets[activeID].phenotypic_features, featureSchema, 'symptom');
          if (!isEmpty(symptomsTable)) {
            // Add onto the existing dictionary of created sub
            setSymptomsTable((prevState) => ({
              ...prevState, ...newFeature,
            }));
            setSymptomsTableData(symptomsTable[activeID]);
          } else {
            setSymptomsTable(newFeature);
            setSymptomsTableData(symptomsTable[activeID]);
          }
        }
      }
    } catch (err) {
      // Need better reporting
    }
  }, [activeID, symptomsTable, phenopackets]);

  useEffect(() => {
    // Want to store previously created tables rather than reprocessing them
    // each time the same sub tables are needed

    try {
      if (activeID) {
        if (complicationsTable[activeID]) {
          // The sub tables have already been created once, so set them back
          setComplicationsTableData(complicationsTable[activeID]);
        } else {
          const newFeature = ProcessFeatures(activeID, phenopackets[activeID].phenotypic_features, featureSchema, 'complication');
          if (!isEmpty(complicationsTable)) {
            // Add onto the existing dictionary of created sub
            setComplicationsTable((prevState) => ({
              ...prevState, ...newFeature,
            }));
            setComplicationsTableData(complicationsTable[activeID]);
          } else {
            setComplicationsTable(newFeature);
            setComplicationsTableData(complicationsTable[activeID]);
          }
        }
      }
    } catch (err) {
      // Need better reporting
    }
  }, [activeID, complicationsTable, phenopackets]);

  useEffect(() => {
    try {
      CreateColumns(Object.keys(symptomsTableData[0]), setSymptomsTableColumns);
    } catch (err) {
      // Need better reporting

    }
  }, [symptomsTableData]);

  useEffect(() => {
    try {
      CreateColumns(Object.keys(complicationsTableData[0]), setComplicationsTableColumns);
    } catch (err) {
      // Need better reporting

    }
  }, [complicationsTableData]);

  let dataM = React.useMemo(() => data, [data]);
  dataM = (typeof dataM === 'undefined') ? [] : dataM;
  const columnsM = React.useMemo(() => columns, [columns]);

  let dataD = React.useMemo(() => diseaseTableData, [diseaseTableData]);
  dataD = (typeof dataD === 'undefined') ? [] : dataD;
  const columnsD = React.useMemo(() => diseaseTableColumns, [diseaseTableColumns]);

  let dataS = React.useMemo(() => symptomsTableData, [symptomsTableData]);
  dataS = (typeof dataS === 'undefined') ? [] : dataS;
  const columnsS = React.useMemo(() => symptomsTableColumns, [symptomsTableColumns]);

  let dataC = React.useMemo(() => complicationsTableData, [complicationsTableData]);
  dataC = (typeof dataC === 'undefined') ? [] : dataC;
  const columnsC = React.useMemo(() => complicationsTableColumns, [complicationsTableColumns]);

  return (
    <div className="content">

      <Row>
        <NotificationAlert ref={notifyEl} />

        <UncontrolledAlert color="info" className="ml-auto mr-auto alert-with-icon" fade={false}>
          <span
            data-notify="icon"
            className="nc-icon nc-zoom-split"
          />

          <b>
            <span>
              <p> Search for a symptom to get started. </p>
              <p>
                {' '}
                A table of individuals exhibiting the searched symptom will be generated.
                Clicking on a row will bring up more tables about the specific individual,
                including their symptoms and associated diseases.
              </p>
            </span>
          </b>
        </UncontrolledAlert>
      </Row>

      <Row>
        <SearchBySymptom
          setSymptom={setSelectedSymptom}
        />
      </Row>
      <Row><Col>{' '}</Col></Row>
      <Row><Col>{' '}</Col></Row>
      <TabStyle>
        <Nav tabs>
          <NavItem hidden={dataM.length > 0 ? '' : 'hidden'}>
            <NavLink
              className={classnames({ active: activeTab === '1' })}
              onClick={() => { toggle('1'); }}
            >
              Individuals
            </NavLink>
          </NavItem>

          <NavItem hidden={dataD.length > 0 ? '' : 'hidden'}>
            <NavLink
              className={classnames({ active: activeTab === '2' })}
              onClick={() => { toggle('2'); }}
            >
              Diseases
            </NavLink>
          </NavItem>

          <NavItem hidden={dataS.length > 0 ? '' : 'hidden'}>
            <NavLink
              className={classnames({ active: activeTab === '3' })}
              onClick={() => { toggle('3'); }}
            >
              Symptoms
            </NavLink>
          </NavItem>

          <NavItem hidden={dataC.length > 0 ? '' : 'hidden'}>
            <NavLink
              className={classnames({ active: activeTab === '4' })}
              onClick={() => { toggle('4'); }}
            >
              Complications
            </NavLink>
          </NavItem>

        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            {promiseInProgress === true ? (
              <LoadingIndicator />
            ) : (
              <ClinMetadataTable
                columns={columnsM}
                data={dataM}
                metadataCallback={() => {}}
                activeMetadata={false}
                setActiveID={setActiveID}
                isMainTable
              />
            )}

          </TabPane>
          <TabPane tabId="2">
            <ClinMetadataTable
              columns={columnsD}
              data={dataD}
              metadataCallback={() => {}}
              activeMetadata={false}
              setActiveID={() => {}}
              isMainTable={false}

            />
          </TabPane>
          <TabPane tabId="3">
            <ClinMetadataTable
              columns={columnsS}
              data={dataS}
              metadataCallback={() => {}}
              activeMetadata={false}
              setActiveID={() => {}}
              isMainTable={false}

            />
          </TabPane>
          <TabPane tabId="4">
            <ClinMetadataTable
              columns={columnsC}
              data={dataC}
              metadataCallback={() => {}}
              activeMetadata={false}
              setActiveID={() => {}}
              isMainTable={false}

            />
          </TabPane>
        </TabContent>
      </TabStyle>

    </div>
  );
}

TableApp.propTypes = {
  updateState: PropTypes.func,
};
TableApp.defaultProps = {
  updateState: () => {},
};

export default TableApp;
